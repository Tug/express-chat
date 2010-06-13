#!/usr/bin/env python

#  Original version from multi-mechanize :

#  Copyright (c) 2010 Corey Goldberg (corey@goldb.org)
#  License: GNU LGPLv3 - distributed under the terms of the GNU Lesser General Public License version 3
#
#  This file is part of Multi-Mechanize:
#       Multi-Process, Multi-Threaded, Web Load Generator, with python-mechanize agents
#
#  requires Python 2.6+


import ConfigParser
import glob
import multiprocessing
import optparse
import os
import Queue
import shutil
import subprocess
import sys
import threading
import thread
import time
import lib.results as results
import lib.progressbar as progressbar

from example_br import *

users_per_room = 5
results_ts_interval = 5
parser = optparse.OptionParser()
parser.add_option('-r', '--rooms', dest="num_rooms", type='int', default=200)
parser.add_option('-t', '--runtime',  dest="run_time",    type='int', default=120)
(cmd_opts, args) = parser.parse_args()

num_threads = cmd_opts.num_rooms * users_per_room
run_time = cmd_opts.run_time
rampup = num_threads
ugname = "group-1"

class UserGroupConfig(object):
    def __init__(self, num_threads, name, script_file):
        self.num_threads = num_threads
        self.name = name
        self.script_file = script_file

user_group_configs = [UserGroupConfig(num_threads, ugname, "example_br.py")]

def main():
    run_test()

def run_test():
    run_localtime = time.localtime()
    output_dir = time.strftime('results/results_%Y.%m.%d_%H.%M.%S/', run_localtime)

    # this queue is shared between all processes/threads
    queue = multiprocessing.Queue()
    rw = ResultsWriter(queue, output_dir)
    rw.daemon = True
    rw.start()

    ug = UserGroup(queue, 1, ugname, num_threads, run_time, rampup)
    ug.start()

    start_time = time.time()
    #ug.join()

    print '  threads: %i\n' % (num_threads)
    p = progressbar.ProgressBar(run_time)
    elapsed = 0
    while elapsed < (run_time + 1):
        p.update_time(elapsed)
        print '%s   transactions: %i  timers: %i  errors: %i' % (p, rw.trans_count, rw.timer_count, rw.error_count)
        sys.stdout.write(chr(27) + '[A' )
        time.sleep(1)
        elapsed = time.time() - start_time
    print p

    i = 0
    while ug.is_alive():
        print 'waiting for all requests to finish...'
        time.sleep(3)
        if i > 20:
            ug.terminate()
        i += 1

    # all agents are done running at this point
    time.sleep(.2) # make sure the writer queue is flushed
    print '\n\nanalyzing results...\n'
    results.output_results(output_dir, 'results.csv', run_time, rampup, results_ts_interval, user_group_configs)
    print 'created: %sresults.html\n' % output_dir
    print 'done.\n'

    return


class UserGroup(multiprocessing.Process):
    def __init__(self, queue, process_num, user_group_name, num_threads, run_time, rampup):
        multiprocessing.Process.__init__(self)
        self.queue = queue
        self.process_num = process_num
        self.user_group_name = user_group_name
        self.num_threads = num_threads
        self.run_time = run_time
        self.rampup = rampup
        self.start_time = time.time()

    def run(self):
        global users_per_room
        threads = []
        lock = thread.allocate_lock()
        spacing = float(self.rampup) / float(self.num_threads)
        for i in range(self.num_threads):
            if i > 0 and i % users_per_room == 0:
                time.sleep(users_per_room*spacing)
            agent_thread = Agent(self.queue, self.process_num, i, self.start_time, self.run_time, self.user_group_name, lock)
            agent_thread.daemon = True
            threads.append(agent_thread)
            agent_thread.start()
        for agent_thread in threads:
            agent_thread.join()


class Agent(threading.Thread):
    def __init__(self, queue, process_num, thread_num, start_time, run_time, user_group_name, lock):
        threading.Thread.__init__(self)
        self.queue = queue
        self.process_num = process_num
        self.thread_num = thread_num
        self.start_time = start_time
        self.run_time = run_time
        self.user_group_name = user_group_name
        self.lock = lock
        self.default_timer = time.time

    def run(self):
        elapsed = 0
        transaction = Transaction(self.thread_num, self.lock)
        transaction.custom_timers = {}

        while elapsed < self.run_time:
            start = self.default_timer()
            transaction.run()
            scriptrun_time = self.default_timer() - start
            elapsed = time.time() - self.start_time
            epoch = time.mktime(time.localtime())
            fields = (elapsed, epoch, self.user_group_name, scriptrun_time, '', transaction.custom_timers)
            self.queue.put(fields)


class ResultsWriter(threading.Thread):
    def __init__(self, queue, output_dir):
        threading.Thread.__init__(self)
        self.queue = queue
        self.output_dir = output_dir
        self.trans_count = 0
        self.timer_count = 0
        self.error_count = 0

        try:
            os.makedirs(self.output_dir, 0755)
        except OSError:
            sys.stderr.write('ERROR: Can not create output directory\n')
            sys.exit(1)

    def run(self):
        with open(self.output_dir + 'results.csv', 'w') as f:
            while True:
                try:
                    elapsed, epoch, self.user_group_name, scriptrun_time, error, custom_timers = self.queue.get(False)
                    self.trans_count += 1
                    self.timer_count += len(custom_timers)
                    if error != '':
                        self.error_count += 1
                    f.write('%i,%.3f,%i,%s,%f,%s,%s\n' % (self.trans_count, elapsed, epoch, self.user_group_name, scriptrun_time, error, repr(custom_timers)))
                    f.flush()
                except Queue.Empty:
                    time.sleep(.05)


if __name__ == '__main__':
    main()

