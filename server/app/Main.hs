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
#define SLEEP_DELAY 20000000

import Prelude hiding (log)
import GHC.Generics
import Data.String
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

type ChessAPI = "board" :> Get '[JSON] Position
                :<|>
                "join" :> ReqBody '[JSON] UserId :> Post '[JSON] Color
                :<|>
                "vote" :> ReqBody '[JSON] VoteReq :> Post '[JSON] ()

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
                   }
type AppM = ReaderT State Handler


server :: ServerT ChessAPI AppM
server = getBoard :<|> joinGame :<|> vote
  where
    getBoard = do
      log "Received GET /board"
      board' <- readTV . board =<< ask
      log ("Board: " ++ show board')
      pure board'

    joinGame uid = do
      log "Received POST /joinGame"

      -- Ensure user is not yet registered
      teams' <- readTV . teams =<< ask
      case M.lookup uid teams' of
        Just c  -> throwError $ err400{errBody = fromString $ "User " ++ show uid ++ " is already in team " ++ show c}
        Nothing -> do

          -- Get next color and update next color
          colorVar <- asks next_player
          color    <- readTV colorVar
          modifyTV colorVar opponent

          -- Store in map assigned color
          (`modifyTV` M.insert uid color) . teams =<< ask
          log ("Assigned " ++ show color ++ " to " ++ show uid)

          pure color


    vote (VoteReq uid plytext) = do
      log ("Received POST /vote by " ++ show uid)

      -- Ensure hasn't played
      has_played' <- readTV . has_played =<< ask
      if uid `S.member` has_played'
        then do
          let errmsg = "User " ++ show uid ++ "has already voted!"
          log errmsg
          throwError $ err400{errBody= fromString errmsg}
        else do
          pos <- readTV . board =<< ask
          case fromUCI pos (unpack plytext) of
            Nothing  -> do
              let errmsg = "Move " ++ show plytext ++ " is invalid or illegal!"
              log errmsg
              throwError $ err400{errBody = fromString errmsg}
            Just ply -> do
                log ("User " ++ show uid ++ " did " ++ show ply)
                liftIO . atomically . (`modifyTVar` M.alter updateVote ply) . votes =<< ask
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
  let state = State{..}

  log "Initialized."

  _ <- forkIO (playGame state)

  run 8081 (serve api (hoistServer api (nt state) server))

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
  threadDelay SLEEP_DELAY

  log "Making a move!"

  -- Compute next play
  votemap <- readTVarIO votes
  case computePlay votemap of
    Nothing ->
      log "No votes at all, not making a move."
    Just play -> do
      -- Update state with the play
      log ("Making the move " ++ show play)
      liftIO $ atomically do
        board   `modifyTVar` (`doPly` play)
        votes   `modifyTVar` const M.empty
        playing `modifyTVar` opponent

  -- Repeat
  playGame State{..}

computePlay :: VoteMap -> Maybe Ply
computePlay vs = case sortOn (Down . snd) $ M.toList vs of
                   [] -> Nothing
                   (ply,_):_ -> Just ply


{---------------------
    Utils
---------------------}

readTV :: TVar a -> AppM a
readTV = liftIO . readTVarIO

modifyTV :: TVar a -> (a -> a) -> AppM ()
modifyTV x = liftIO . atomically . modifyTVar x

log :: MonadIO m => String -> m ()
log = liftIO . putStrLn
