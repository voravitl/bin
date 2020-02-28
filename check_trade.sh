COIN=$1
#sleep 2m
#END=`docker logs $COIN | grep $COIN-BTC | grep -v wrote  | awk '{print $1,$2}' | sed -e  's/\x1B\[\([0-9]\{1,2\}\(;[0-9]\{1,2\}\)\?\)\?[mGK]//g' | tail -3  | head -1`

LINE ()  {  #### $1
BALANCE=$1
TOKEN="SxWi3636MoV2lDSBQ4n8L2N79RYa9q6NlnTivy562Dh"

curl -X POST -H "Authorization: Bearer $TOKEN" -F 'message='"$BALANCE"' ' https://notify-api.line.me/api/notify
}

chk_error () {
MESSAGE=`docker logs $COIN | grep  -o -b2 "Error: binance.*" | egrep -v "MIN_NOTIONAL|Timestamp" | grep -v - '--'`

if [ ! -z "$MESSAGE" ] ; then
LINE "$MESSAGE $COIN"
fi

}
provide_error="/tmp/provide_error.${COIN}.txt"
last_error="/tmp/last_error.${COIN}.txt"

chk_error2 () {
docker logs $COIN | grep  -o -b2 "Error: binance.*" | egrep -v "MIN_NOTIONAL|Timestamp" | grep -v - '--' > /tmp/last_error.${COIN}.txt

if [ "`diff $last_error $provide_error| wc -l`" -gt "0" ] ; then
 if [ ! -z "$last_error" ] ; then
LINE "$COIN `cat $last_error`"
 fi 
fi
cp  $last_error $provide_error
#rm -f $last_error
}

chk_error2
START=/tmp/bot_run.$COIN-start.txt
END=/tmp/bot_run.$COIN-end.txt
NAME_COIN=`echo $COIN | sed 's/[0-9]*//g'`

docker logs $COIN | grep ${NAME_COIN}-BTC | grep -v wrote  | awk '{print $1,$2}' | sed -e  's/\x1B\[\([0-9]\{1,2\}\(;[0-9]\{1,2\}\)\?\)\?[mGK]//g' | tail -1 > $START
if [ "`diff $START $END | wc -l `" -eq 0  ] ; then 
diff $START $END
LINE "BOT STOP TRADE . AUTO RESTART $COIN"
#docker rm -f ${COIN}
#screen -S ${COIN} -X stuff "${COIN}_RUN\n"
#screen  -S ${COIN}  -dm "${COIN}_RUN"
#docker restart $COIN
      else 
diff $START $END
 echo "BOT Running $COIN"
fi
mv  $START $END
