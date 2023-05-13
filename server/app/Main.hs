{-# OPTIONS_GHC -Wno-orphans #-}
{-# LANGUAGE DataKinds #-}
{-# LANGUAGE RecordWildCards #-}
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
import Data.Ord
import Data.List (sortOn)
import Control.Concurrent
import qualified Data.Vector.Unboxed as V
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

type ChessAPI = "getBoard" :> Get '[JSON] Position
                :<|>
                "join" :> ReqBody '[JSON] UserId :> Post '[JSON] Color
                :<|>
                "vote" :> ReqBody '[JSON] PlyText :> Post '[JSON] ()

instance ToJSON Position where
  toJSON = String . pack . toFEN

instance ToJSON Color where
  toJSON = String . pack . show


{---------------------
    Server
---------------------}

type VoteMap = M.Map Ply Int
data State = State { board       :: TVar Position
                   , votes       :: TVar VoteMap -- Note: this map represents all valid next moves
                   , playing     :: TVar Color
                   , next_player :: TVar Color
                   , black_team  :: TVar (S.Set UserId)
                   , white_team  :: TVar (S.Set UserId)
                   }
type AppM = ReaderT State Handler


server :: ServerT ChessAPI AppM
server = getBoard :<|> joinGame :<|> vote
  where
    getBoard = do
      log "Received GET /getBoard"
      readTV . board =<< ask

    joinGame uid = do
      log "Received POST /joinGame"
      colorVar <- asks next_player
      color    <- readTV colorVar
      modifyTV colorVar opponent
      (`modifyTV` S.insert uid) . what_team color =<< ask
      pure color
        where
          what_team color = case color of
                              Black -> black_team
                              White -> white_team


    vote plytext = do
      log "Received POST /vote"
      pos <- readTV . board =<< ask
      case fromUCI pos (unpack plytext) of
        Nothing -> throwError $ err400{errBody =  "Move incorrectly formatted"}
        Just ply
          | not (ply `V.elem` legalPlies' pos) -> throwError $ err400{errBody = "Illegal move"}
          | otherwise                          -> do
            liftIO . atomically . (`modifyTVar` M.alter updateVote ply) . votes =<< ask
            pure ()
            where
              updateVote = \case Nothing -> Just 1
                                 Just y  -> Just (y+1)

main :: IO ()
main = do
  board       <- newTVarIO startpos
  votes       <- newTVarIO M.empty
  playing     <- newTVarIO White
  next_player <- newTVarIO White
  black_team  <- newTVarIO S.empty
  white_team  <- newTVarIO S.empty
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
