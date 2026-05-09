1. mkdir data
1. docker run -it -v $PWD/data:/root/.config/calcure calcure

Or

1. docker volume create calcure_data
1. docker run -it -v calcure_data:/root/.config/calcure calcure
