FROM alpine
RUN apk add curl
ARG UNITS
ENV UNITS=$UNITS
CMD curl http://wttr.in/$CITY?$UNITS
