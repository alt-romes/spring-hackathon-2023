build-docker :
	docker build --build-arg EXECUTABLE=server --tag spring-hackathon-chess-server .

run-docker :
	docker run -ti --publish 8081:8081 spring-hackathon-chess-server
