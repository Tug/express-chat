#!/usr/bin/env python

import mechanize._mechanize
import time
import urllib, urllib2
import json
import random
import thread

HTTP_SERVERS = ["http://128.178.156.203:3000"]
#HTTP_SERVERS = ["http://10.177.0.131:3000", "http://10.177.0.132:3000"]
#HTTP_SERVERS = ["http://92.104.99.179:3000", "http://92.104.99.179:3001"]
USERS_PER_ROOM = 5
ROOM_INC = 0
ROOMS = {}
MESSAGE_INC = 0
MESSAGES_TIME = []

message = "Node.js is an evented I/O  framework for the V8 JavaScript engine."

class Transaction(object):
    def __init__(self, thread_num, lock):
        global HTTP_SERVERS, ROOM_INC, USER_INC, USERS_PER_ROOM, ROOMS
        self.lock = lock
        self.thread_num = thread_num
        r = random.randint(0, len(HTTP_SERVERS)-1)
        self.http_server = HTTP_SERVERS[r]
        self.custom_timers = {}
        self.br = mechanize.Browser()
        self.br.set_handle_robots(False)
        self.br.addheaders = [('User-agent', 'Mozilla/5.0 Compatible')]
        self.lock.acquire()
        if thread_num % USERS_PER_ROOM == 0:
            ROOM_INC += 1
        self.userID = thread_num % USERS_PER_ROOM
        self.roomID = ROOM_INC
        self.lock.release()
        if self.userID == 0:
            self.createChatRoom()
            ROOMS[self.roomID] = True
            self.loadPage("/room/r%d" %self.roomID)
        else:
            while self.roomID not in ROOMS:
                time.sleep(1)
            self.loadPage("/room/r%d" %self.roomID)
            self.br.select_form(name="sendmsg")
            self.br.form.action += "/live"

    def run(self):
        if self.userID == 0:
            self.listener()
        else:
            self.speaker()

    def speaker(self):
        global MESSAGE_INC, MESSAGES_TIME
        for i in range(5):
            self.lock.acquire()
            msgId = MESSAGE_INC
            MESSAGE_INC += 1
            self.br.form["message"] = "%09d %s" %(msgId, message)
            MESSAGES_TIME.insert(msgId, time.time())
            self.postFormAsync()
            self.lock.release()
            time.sleep(self.userID)

    def listener(self):
        global MESSAGES_TIME, USERS_PER_ROOM
        i = 0
        totalMsg = (USERS_PER_ROOM-1)*5
        while i < totalMsg:
            resp = self.getAsync("/room/r%d/live/msg/%d" %(self.roomID, i))
            timeReceived = time.time()
            content = json.loads(resp.read())
            messages = content["messages"]
            for m in messages:
                pos = m.find(':')
                msgId = int(m[pos+2:pos+11])
                self.custom_timers["msg"] = timeReceived - MESSAGES_TIME[msgId]
            i += len(messages)

    def createChatRoom(self):
        self.post("/", {"name": "Anonymous", "roomID": "r%d" %(self.roomID)})

    def loadPage(self, path):
        resp = self.br.open(self.http_server+path)
        content = resp.read()
        if hasattr(self.br.request, "redirect_dict"):
            redirs = self.br.request.redirect_dict.keys()
            if len(redirs) > 0:
                self.http_server = redirs[0][0:redirs[0].find("/room")]
        assert (resp.code == 200), "Bad HTTP Response"
        return resp

    def get(self, path):
        print self.http_server+path
        resp = urllib2.urlopen(self.http_server+path)
        assert (resp.code == 200), "Bad HTTP Response"
        return resp

    def post(self, path, params):
        data = urllib.urlencode(params)
        req = urllib2.Request(self.http_server+path, data)
        resp = urllib2.urlopen(req)
        content = resp.read()
        assert (resp.code == 200), "Bad HTTP Response"
        return resp

    def getAsync(self, path):
        resp = self.br.open_novisit(path)
        assert (resp.code == 200), "Bad HTTP Response"
        return resp

    def postForm(self, path):
        resp = self.br.open(path)
        resp.read()
        assert (resp.code == 200), "Bad HTTP Response"

    def postFormAsync(self):
        resp = self.br.open_novisit(self.br.click())
        resp.read()
        assert (resp.code == 200), "Bad HTTP Response"

if __name__ == "__main__":
    trans = Transaction(0,thread.allocate_lock())
    trans.run()

