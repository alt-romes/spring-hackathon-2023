# BUILDER
##############################################################################

FROM haskell:9.4 AS builder

WORKDIR /build/server

# cabal-install configuration
# - we'll be in better control of the build environment, than with default config.
COPY ./server/docker.cabal.config ./cabal.config
ENV CABAL_CONFIG ./cabal.config

# Update cabal-install database
RUN cabal v2-update

# Install cabal-plan
# - we'll need it to find build artifacts
# - note: actual build tools ought to be specified in build-tool-depends field
# RUN cabal v2-install cabal-plan --constraint='cabal-plan ^>=0.5' --constraint='cabal-plan +exe'

# Add a .cabal file to build environment
# - it's enough to build dependencies
COPY ./server/*.cabal ./server/cabal.project ./

# Build package dependencies first
# - beware of https://github.com/haskell/cabal/issues/6106
RUN cabal v2-build -v1 --dependencies-only all

# Add rest of the files into build environment
# - remember to keep .dockerignore up to date
COPY ./server /build/server/

# An executable to build
ARG EXECUTABLE

# Check that ARG is set up
RUN if [ -z "$EXECUTABLE" ]; then echo "ERROR: Empty $EXECUTABLE"; false; fi

# BUILD!!!
RUN cabal v2-build -v1 exe:$EXECUTABLE && cp $(cabal list-bin server) ./server

# Copy build artifact to known directory
# - todo arg
# RUN mkdir -p /build/artifacts && cp $(cabal-plan list-bin $EXECUTABLE) /build/artifacts/

# Make a final binary a bit smaller
# RUN strip /build/artifacts/$EXECUTABLE; done

# Small debug output
# RUN ls -lh /build/artifacts

# DEPLOYMENT IMAGE
##############################################################################

FROM ubuntu:18.04
LABEL author="Oleg Grenrus <oleg.grenrus@iki.fi>"

# Dependencies
# - no -dev stuff
# - cleanup apt stuff after installation
# RUN apt-get -yq update && apt-get -yq --no-install-suggests --no-install-recommends install \
#     ca-certificates \
#     curl \
#     libgmp10 \
#     liblapack3 \
#     liblzma5 \
#     libpq5 \
#     libssl1.1 \
#     libyaml-0-2 \
#     netbase \
#     openssh-client \
#     zlib1g \
#   && apt-get clean \
#   && rm -rf /var/lib/apt/lists/*

# Working directory
WORKDIR /app

# Expose port
#EXPOSE 8081
EXPOSE 80

# Inherit the executable argument
ARG EXECUTABLE

# Copy build artifact from a builder stage
COPY --from=builder /build/server/server /app/$EXECUTABLE

COPY ./docs/ /docs

# ARG env isn't preserved, so we make another ENV
ENV EXECUTABLE_ $EXECUTABLE

RUN env
RUN ls /app

# Set up a default command to run
ENTRYPOINT /app/${EXECUTABLE_}
