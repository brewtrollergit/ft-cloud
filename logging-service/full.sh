#!/bin/bash

nc -u -w1 localhost 8080 << EOF
{"v":1,"i":"3w5e11264sg0g","z0":{"name":"Fermenter 1","p":38.2,"s":40.1,"o":0},"z1":{"name":"Fermenter 2","p":38.2,"s":40.1,"o":0},"z2":{"name":"Fermenter 3","p":38.2,"s":40.1,"o":0},"z3":{"name":"Fermenter 4","p":38.2,"s":40.1,"o":0},"z4":{"name":"Fermenter 5","p":38.2,"s":40.1,"o":0},"z5":{"name":"Fermenter 6","p":38.2,"s":40.1,"o":0},"z6":{"name":"Glycol Chiller","p":38.2,"s":40.1,"o":0},"z7":{"name":"Kegerator","p":38.2,"s":40.1,"o":0}}
EOF

