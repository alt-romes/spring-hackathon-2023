{-# OPTIONS_GHC -Wno-orphans #-}
{-# LANGUAGE DataKinds #-}
{-# LANGUAGE MagicHash #-}
{-# LANGUAGE UnicodeSyntax #-}
{-# LANGUAGE FlexibleInstances #-}
{-# LANGUAGE MultiParamTypeClasses #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RankNTypes #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE TypeOperators #-}
module Main where

import GHC.Exts (RealWorld)
import GHC.Generics
import qualified Data.Vector.Unboxed as V
import qualified Data.Map as M
import Control.Concurrent.Counter.Unlifted
import Data.Coerce
import Data.Maybe
import Data.Text (Text, unpack)
import Data.Proxy
import Servant
import Network.Wai.Handler.Warp
import Data.Aeson
import Control.Monad.STM
import Control.Concurrent.STM.TVar
import Control.Monad.Reader

import Game.Chess

type PlyText = Text

type ChessAPI = "vote" :> ReqBody '[JSON] PlyText :> Post '[JSON] (Maybe Text) -- If valid, returns Nothing, otherwise, returns the error message
                -- :<|>:
                -- "get" 


-- instance FromJSON Ply where
--   parseJSON = withObject "Ply" $ \v -> fromJust . fromUCI <$> (v .: "ply")


{---------------------
    Server
---------------------}

data State = State { board :: TVar Position
                   , votes :: TVar (M.Map Ply Int) -- Note: this map represents all the existing positions
                                                   -- Would like use but no unlifted map for now (Counter RealWorld). Do the easy thing.
                   }
type AppM = ReaderT State Handler


server :: ServerT ChessAPI AppM
server plytext = vote
  where
    vote = do
      pos <- liftIO . readTVarIO . board =<< ask
      case fromUCI pos (unpack plytext) of
        Nothing -> pure (Just "Move incorrectly formatted")
        Just ply
          | not (ply `V.elem` legalPlies' pos) -> pure (Just "Illegal move")
          | otherwise                          -> do
            liftIO . atomically . (`modifyTVar` M.adjust (+1) ply) . votes =<< ask
            pure Nothing

main :: IO ()
main = do
  initialPos <- newTVarIO startpos
  initialLegalPlies <- newTVarIO (M.fromList $ map (,0) (legalPlies startpos))
  run 8081 (serve api (hoistServer api (nt (State initialPos initialLegalPlies)) server))

  where nt :: State -> (∀ a. AppM a -> Handler a)
        nt s x = runReaderT x s

        api :: Proxy ChessAPI
        api = Proxy


