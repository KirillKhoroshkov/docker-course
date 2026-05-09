### Команды для предварительной настройки и запуска приложений совместно

```bash
# Находимся в final_practice
# Собираем образы
docker build -t image-compress image-compress
docker build -t image-serve image-serve
# Создаем сеть и том
docker network create image_network
docker volume create image_volume
# Запускаем контейнеры приложений
docker run -d -u $(id -u):$(id -g) --network image_network -v image_volume:/app/data -e COMPRESS_RATIO=10 -e IMAGE_PATH=/app/data --name image-compress image-compress
docker run -d -u $(id -u):$(id -g) --network image_network -v image_volume:/data/images --name image-serve image-serve
# Запускаем nginx-прокси
docker run -d --network image_network -p 18080:18080 -v ${PWD}/proxy/conf.d/image-serv.conf:/etc/nginx/conf.d/default.conf:ro --name image_nginx nginx:1.27-alpine
```

### Демонстрация работы системы

```bash
zsh test.sh
test image uploaded OK
compressed image downloaded OK
compressed image size verified
test OK!
```

### Демонстрация работы встроенного DNS

```bash
docker exec -it image_nginx sh
/ # wget -qO- http://image-compress:18080/compress
wget: server returned error: HTTP/1.1 405 METHOD NOT ALLOWED
```

### Статистика работы контейнеров

```bash
docker stats image_nginx image-compress image-serve
```

```
# Во время выполнения скрипта
CONTAINER ID   NAME             CPU %     MEM USAGE / LIMIT    MEM %     NET I/O           BLOCK I/O     PIDS
0a479a1981c1   image_nginx      3.85%     8.914MiB / 7.75GiB   0.11%     2.06MB / 2.05MB   0B / 20.5kB   11
cc67f330f938   image-compress   10.33%    27.1MiB / 7.75GiB    0.34%     1.6MB / 89.8kB    0B / 598kB    1
2a9299189fea   image-serve      1.97%     7.074MiB / 7.75GiB   0.09%     79kB / 312kB      0B / 0B       5
# После завершения скрипта
CONTAINER ID   NAME             CPU %     MEM USAGE / LIMIT    MEM %     NET I/O           BLOCK I/O     PIDS
0a479a1981c1   image_nginx      0.00%     8.883MiB / 7.75GiB   0.11%     2.83MB / 2.82MB   0B / 20.5kB   11
cc67f330f938   image-compress   0.06%     26.88MiB / 7.75GiB   0.34%     2.2MB / 123kB     0B / 823kB    1
2a9299189fea   image-serve      0.00%     7.078MiB / 7.75GiB   0.09%     108kB / 429kB     0B / 0B       5
```

### Пространства имён

Получаем pid контейнера:

```
docker container inspect image-serve | jq -r .[]
.State.Pid
19564
```

Запускаем специальный контейнер на Mac-е:

```
docker run -it --rm --privileged --pid=host alpine nsenter -t 1 -m -u -n -i sh
```

```
# Приведите список интерфейсов, настроенных в сетевом пространстве имён image-serve
sh-5.2# nsenter -t 19564 -n ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: tunl0@NONE: <NOARP> mtu 1480 qdisc noop state DOWN group default qlen 1000
    link/ipip 0.0.0.0 brd 0.0.0.0
3: gre0@NONE: <NOARP> mtu 1476 qdisc noop state DOWN group default qlen 1000
    link/gre 0.0.0.0 brd 0.0.0.0
4: gretap0@NONE: <BROADCAST,MULTICAST> mtu 1462 qdisc noop state DOWN group default qlen 1000
    link/ether 00:00:00:00:00:00 brd ff:ff:ff:ff:ff:ff
5: erspan0@NONE: <BROADCAST,MULTICAST> mtu 1450 qdisc noop state DOWN group default qlen 1000
    link/ether 00:00:00:00:00:00 brd ff:ff:ff:ff:ff:ff
6: ip_vti0@NONE: <NOARP> mtu 1480 qdisc noop state DOWN group default qlen 1000
    link/ipip 0.0.0.0 brd 0.0.0.0
7: ip6_vti0@NONE: <NOARP> mtu 1428 qdisc noop state DOWN group default qlen 1000
    link/tunnel6 :: brd :: permaddr 9ac6:10a3:6306::
8: sit0@NONE: <NOARP> mtu 1480 qdisc noop state DOWN group default qlen 1000
    link/sit 0.0.0.0 brd 0.0.0.0
9: ip6tnl0@NONE: <NOARP> mtu 1452 qdisc noop state DOWN group default qlen 1000
    link/tunnel6 :: brd :: permaddr 86aa:eb10:6685::
10: ip6gre0@NONE: <NOARP> mtu 1448 qdisc noop state DOWN group default qlen 1000
    link/gre6 :: brd :: permaddr 2e2d:e928:e27::
11: eth0@if51: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default 
    link/ether 62:4d:62:ae:eb:51 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.19.0.3/16 brd 172.19.255.255 scope global eth0
       valid_lft forever preferred_lft forever

# Приведите таблицу маршрутизации сетевого пространства имён image-serve
sh-5.2# nsenter -t 19764 -n ip route
default via 172.19.0.1 dev eth0
172.19.0.0/16 dev eth0 proto kernel scope link src 172.19.0.4

# Список открытых портов TCP в сетевом пространстве имён image-serve
sh-5.2# nsenter -t 19764 -n netstat -tlpn
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 0.0.0.0:18080           0.0.0.0:*               LISTEN      19764/nginx: master 
tcp        0      0 127.0.0.11:33301        0.0.0.0:*               LISTEN      301/dockerd         
```

### iptables

```
# Приведите правила таблицы `nat` в цепочке `DOCKER` в сетевом пространстве хоста
sh-5.2# iptables -t nat -L DOCKER -n -v
Chain DOCKER (2 references)
 pkts bytes target     prot opt in     out     source               destination         
    0     0 DNAT       6    --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:18080 to:172.19.0.4:18080
```
