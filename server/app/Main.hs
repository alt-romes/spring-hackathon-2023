{-# OPTIONS_GHC -Wno-orphans #-}
{-# LANGUAGE DataKinds #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE BlockArguments #-}
{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE UnicodeSyntax #-}
{-# LANGUAGE FlexibleInstances #-}
{-# LANGUAGE MultiParamTypeClasses #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RankNTypes #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE TypeOperators #-}
{-# LANGUAGE CPP #-}
module Main where

-- 20 seconds
#define SLEEP_DELAY_MICROSECONDS 20000000
#define SLEEP_DELAY_SECONDS 20

import Prelude hiding (log)
import GHC.Generics
import Data.Time
import Data.Ord
import Data.List (sortOn)
import Control.Concurrent
import qualified Data.Map as M
import qualified Data.Set as S
import Data.Text (Text, unpack, pack)
import Data.Proxy
import Servant
import Network.Wai.Handler.Warp
import Data.Aeson
import Control.Monad.STM
import Control.Concurrent.STM.TVar
import Control.Monad.Reader

import Game.Chess

{---------------------
    API
---------------------}

type PlyText = Text
type UserId  = Text


data VoteReq = VoteReq { uid :: UserId
                       , ply :: PlyText
                       } deriving (Generic)
instance ToJSON VoteReq
instance FromJSON VoteReq

data TopVote = TopVote { place :: Int
                       , move  :: PlyText
                       , number :: Int
                       } deriving (Generic)
instance ToJSON TopVote
instance FromJSON TopVote

type ChessAPI = "board" :> Get '[JSON] Position
                :<|>
                "join" :> ReqBody '[JSON] UserId :> Post '[JSON] Color
                :<|>
                "vote" :> ReqBody '[JSON] VoteReq :> Post '[JSON] ()
                :<|>
                "timeleft" :> Get '[JSON] NominalDiffTime
                :<|>
                "playing" :> Get '[JSON] Color
                :<|>
                "topvotes" :> Capture "n" Int :> Get '[JSON] [TopVote]
                :<|>
                Raw -- Serve static directory /docs

instance ToJSON Position where
  toJSON = String . pack . toFEN

instance ToJSON Color where
  toJSON = String . pack . show


{---------------------
    Server
---------------------}

type VoteMap = M.Map Ply Int
data State = State { board       :: TVar Position
                   , votes       :: TVar VoteMap  -- Note: this map represents all valid next moves
                   , has_played  :: TVar (S.Set UserId) -- List of users who have already played this round
                   , playing     :: TVar Color
                   , next_player :: TVar Color
                   , teams       :: TVar (M.Map UserId Color)
                   , last_play   :: TVar UTCTime
                   }
type AppM = ReaderT State Handler


server :: ServerT ChessAPI AppM
server = getBoard :<|> joinGame :<|> vote :<|> timeleft :<|> getPlaying :<|> topVotes :<|> serveDirectoryWebApp "../docs/"
  where
    getBoard = do
      log "Received GET /board"
      board' <- readBoard
      log ("Board: " ++ show board')
      pure board'

    joinGame uid = do
      log "Received POST /joinGame"

      -- Ensure user is not yet registered
      teams' <- readTeams
      case M.lookup uid teams' of
        Just c  -> fail400 ("User " ++ unpack uid ++ " is already in team " ++ show c)
        Nothing -> do

          -- Get next color and update next color
          colorVar <- asks next_player
          color    <- readTV colorVar
          modifyTV colorVar opponent

          -- Store in map assigned color
          (`modifyTV` M.insert uid color) . teams =<< ask
          log ("Assigned " ++ show color ++ " to " ++ show uid)

          pure color

    timeleft = do
      log "Received GET /timeleft"
      now <- liftIO getCurrentTime
      last' <- readTV . last_play =<< ask
      let time_left = secondsToNominalDiffTime SLEEP_DELAY_SECONDS - (now `diffUTCTime` last')
      log ("Time left: " ++ show time_left)
      pure time_left

    getPlaying = do
      log "Received GET /playing"
      readPlaying

    topVotes howmany = do
      log "Received GET /topvotes/:n"
      votemap <- readTV . votes =<< ask
      pure $ take howmany $ zipWith (\(ply,n) i -> TopVote i (pack $ toUCI ply) n) (sortByVotes votemap) [1..]

    vote (VoteReq uid plytext) = do
      log ("Received POST /vote by " ++ show uid)

      -- Ensure player is in the team currently playing
      curr_team <- readPlaying
      teams'    <- readTeams
      case M.lookup uid teams' of
        Nothing -> fail400 ("User " ++ unpack uid ++ " has not joined!")
        Just player_col -> when (curr_team /= player_col) $
                            fail400 ("User " ++ unpack uid ++ " not in team " ++ show curr_team)

      -- Ensure hasn't played
      has_played' <- readHasPlayed
      if uid `S.member` has_played'
        then
          fail400 ("User " ++ unpack uid ++ "has already voted!")
        else do
          pos <- readBoard
          case fromUCI pos (unpack plytext) of
            Nothing  ->
              fail400 ("Move " ++ show plytext ++ " is invalid or illegal!")
            Just ply -> do
                log ("User " ++ show uid ++ " did " ++ show ply)
                liftIO . atomically . (`modifyTVar` M.alter updateVote ply) . votes =<< ask
                liftIO . atomically . (`modifyTVar` S.insert uid) . has_played =<< ask
                where
                  updateVote = \case Nothing -> Just 1
                                     Just y  -> Just (y+1)

main :: IO ()
main = do
  board       <- newTVarIO startpos
  votes       <- newTVarIO M.empty
  has_played  <- newTVarIO S.empty
  playing     <- newTVarIO White
  next_player <- newTVarIO White
  teams       <- newTVarIO M.empty
  last_play   <- newTVarIO =<< getCurrentTime
  let state = State{..}

  log "Initialized."

  _ <- forkIO (playGame state)

  run 80 (serve api (hoistServer api (nt state) server))

  where nt :: State -> (∀ a. AppM a -> Handler a)
        nt s x = runReaderT x s

        api :: Proxy ChessAPI
        api = Proxy

{---------------------
    Main Game
---------------------}

playGame :: State -> IO ()
playGame State{..} = do

  -- Sleep
  threadDelay SLEEP_DELAY_MICROSECONDS
  now <- getCurrentTime

  log "Making a move!"

  -- Compute next play
  votemap <- readTVarIO votes
  case computePlay votemap of
    Nothing -> do
      log "No votes at all, not making a move."
      liftIO $ atomically do
        has_played `modifyTVar` const S.empty
        last_play `writeTVar` now
    Just play -> do

      -- Update state with the play
      log ("Making the move " ++ show play)
      liftIO $ atomically do
        board   `modifyTVar` (`doPly` play)
        votes   `modifyTVar` const M.empty
        playing `modifyTVar` opponent
        last_play `writeTVar` now
        has_played `modifyTVar` const S.empty

  -- Repeat
  playGame State{..}

computePlay :: VoteMap -> Maybe Ply
computePlay vs = case sortByVotes vs of
                   [] -> Nothing
                   (ply,_):_ -> Just ply

sortByVotes :: VoteMap -> [(Ply,Int)]
sortByVotes = sortOn (Down . snd) . M.toList


{---------------------
    Utils
---------------------}

readTV :: TVar a -> AppM a
readTV = liftIO . readTVarIO

modifyTV :: TVar a -> (a -> a) -> AppM ()
modifyTV x = liftIO . atomically . modifyTVar x

log :: MonadIO m => String -> m ()
log = liftIO . putStrLn

readBoard :: AppM Position
readBoard = readTV . board =<< ask

readTeams :: AppM (M.Map UserId Color)
readTeams = readTV . teams =<< ask

readPlaying :: AppM Color
readPlaying = readTV . playing =<< ask

readHasPlayed :: AppM (S.Set UserId)
readHasPlayed = readTV . has_played =<< ask

fail400 :: String -> AppM a
fail400 s = do
  log s
  throwError $ err400{errBody=encode s}

