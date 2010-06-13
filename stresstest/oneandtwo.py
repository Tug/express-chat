#!/usr/bin/env python
#
#  Copyright (c) 2010 Corey Goldberg (corey@goldb.org)
#  License: GNU LGPLv3
#
#  This file is part of Multi-Mechanize


import time
from collections import defaultdict
import matplotlib
matplotlib.use('Agg')  # use a non-GUI backend
from pylab import *

class UserGroupConfig(object):
    def __init__(self, num_threads, name, script_file):
        self.num_threads = num_threads
        self.name = name
        self.script_file = script_file

results_dir = "./results/v2/"
results_dir1 = results_dir + "1srv4client120000room/"
results_dir2 = results_dir + "2srv4client120000room/"
results_file = 'results.csv'
run_time = 500
rampup = run_time
ts_interval = 5
num_threads = 120000
cutendval = 3

def timeToRoom(t):
    return int( float(num_threads) / float(run_time) * t / float(1000) )

def resp_graph(dicts, legends, colors, image_name, dir='./'):
    fig = figure(figsize=(8, 3.3))  # image dimensions  
    ax = fig.add_subplot(111)
    ax.set_xlabel('number of rooms (x1000)', size='x-small')
    ax.set_ylabel('Response Time (secs)' , size='x-small')
    ax.grid(True, color='#666666')
    xticks(size='x-small')
    yticks(size='x-small')
    
    for i in range(len(dicts)):
        x_seq = sorted(dicts[i].keys())
        x_seq = x_seq[0:len(x_seq)-1-cutendval]
        y_seq = [dicts[i][x] for x in x_seq]
        x_seq = map(timeToRoom, x_seq)
        ax.plot(x_seq, y_seq, 
            color=colors[i], linestyle='-', linewidth=0.75, marker='o', 
            markeredgecolor=colors[i], markerfacecolor='yellow', markersize=2.0)
    
    ax.plot([0.0,], [0.0,], linewidth=0.0, markersize=0.0)
    
    legend_lines = reversed(ax.get_lines()[:len(dicts)])
    ax.legend(
            legend_lines,
            legends,
            loc='best',
            handlelength=1,
            borderpad=1,                
            prop=matplotlib.font_manager.FontProperties(size='xx-small')
            )
            
    savefig(image_name)

def output_results(results_dir, results_file, run_time, rampup, ts_interval, user_group_configs=None):

    results = Results(results_dir + results_file, run_time)

    # all transactions - response times
    trans_timer_points = []  # [elapsed, timervalue]
    trans_timer_vals = []
    for resp_stats in results.resp_stats_list:
        t = (resp_stats.elapsed_time, resp_stats.trans_time)
        trans_timer_points.append(t)
        trans_timer_vals.append(resp_stats.trans_time)

    # all transactions - interval details
    avg_resptime_points = {}  # {intervalnumber: avg_resptime}
    percentile_80_resptime_points = {}  # {intervalnumber: 80pct_resptime}
    percentile_90_resptime_points = {}  # {intervalnumber: 90pct_resptime}
    interval_secs = ts_interval
    splat_series = split_series(trans_timer_points, interval_secs)
    for i, bucket in enumerate(splat_series):
        interval_start = int((i + 1) * interval_secs)
        cnt = len(bucket)

        if cnt > 0:
            avg = average(bucket)
            pct_80 = percentile(bucket, 80)
            pct_90 = percentile(bucket, 90)
            pct_95 = percentile(bucket, 95)
            stdev = standard_dev(bucket)

            avg_resptime_points[interval_start] = avg
            percentile_80_resptime_points[interval_start] = pct_80
            percentile_90_resptime_points[interval_start] = pct_90

    # custom timers
    for timer_name in sorted(results.uniq_timer_names):
        custom_timer_vals = []
        custom_timer_points = []
        for resp_stats in results.resp_stats_list:
            if timer_name in resp_stats.custom_timers:
                val = resp_stats.custom_timers[timer_name]
                custom_timer_points.append((resp_stats.elapsed_time, val))
                custom_timer_vals.append(val)

        throughput_points = {}  # {intervalnumber: numberofrequests}
        interval_secs = 5.0
        splat_series = split_series(custom_timer_points, interval_secs)
        for i, bucket in enumerate(splat_series):
            throughput_points[int((i + 1) * interval_secs)] = (len(bucket) / interval_secs)

        # custom timers - interval details
        avg_resptime_points = {}  # {intervalnumber: avg_resptime}
        percentile_80_resptime_points = {}  # {intervalnumber: 80pct_resptime}
        percentile_90_resptime_points = {}  # {intervalnumber: 90pct_resptime}
        interval_secs = ts_interval
        splat_series = split_series(custom_timer_points, interval_secs)
        for i, bucket in enumerate(splat_series):
            interval_start = int((i + 1) * interval_secs)
            cnt = len(bucket)

            if cnt > 0:
                avg = average(bucket)
                pct_80 = percentile(bucket, 80)
                pct_90 = percentile(bucket, 90)
                pct_95 = percentile(bucket, 95)
                stdev = standard_dev(bucket)

                avg_resptime_points[interval_start] = avg
                percentile_80_resptime_points[interval_start] = pct_80
                percentile_90_resptime_points[interval_start] = pct_90

    return (avg_resptime_points, percentile_80_resptime_points, percentile_90_resptime_points)


class Results(object):
    def __init__(self, results_file_name, run_time):
        self.results_file_name = results_file_name
        self.run_time = run_time
        self.total_transactions = 0
        self.total_errors = 0
        self.uniq_timer_names = set()
        self.uniq_user_group_names = set()

        self.resp_stats_list = self.__parse_file()

        self.epoch_start = self.resp_stats_list[0].epoch_secs
        self.epoch_finish = self.resp_stats_list[-1].epoch_secs
        self.start_datetime = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(self.epoch_start))
        self.finish_datetime = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(self.epoch_finish))



    def __parse_file(self):
        f = open(self.results_file_name, 'rb')
        resp_stats_list = []
        for line in f:
            fields = line.strip().split(',')

            request_num = int(fields[0])
            elapsed_time = float(fields[1])
            epoch_secs = int(fields[2])
            user_group_name = fields[3]
            trans_time = float(fields[4])
            error = fields[5]

            self.uniq_user_group_names.add(user_group_name)

            custom_timers = {}
            timers_string = ''.join(fields[6:]).replace('{', '').replace('}', '')
            splat = timers_string.split("'")[1:]
            timers = []
            vals = []
            for x in splat:
                if ':' in x:
                    x = float(x.replace(': ', ''))
                    vals.append(x)
                else:
                    timers.append(x)
                    self.uniq_timer_names.add(x)
            for timer, val in zip(timers, vals):
                custom_timers[timer] = val

            r = ResponseStats(request_num, elapsed_time, epoch_secs, user_group_name, trans_time, error, custom_timers)

            if elapsed_time < self.run_time:  # drop all times that appear after the last request was sent (incomplete interval)
                resp_stats_list.append(r)

            if error != '':
                self.total_errors += 1

            self.total_transactions += 1

        return resp_stats_list



class ResponseStats(object):
    def __init__(self, request_num, elapsed_time, epoch_secs, user_group_name, trans_time, error, custom_timers):
        self.request_num = request_num
        self.elapsed_time = elapsed_time
        self.epoch_secs = epoch_secs
        self.user_group_name = user_group_name
        self.trans_time = trans_time
        self.error = error
        self.custom_timers = custom_timers



def split_series(points, interval):
    offset = points[0][0]
    maxval = int((points[-1][0] - offset) // interval)
    vals = defaultdict(list)
    for key, value in points:
        vals[(key - offset) // interval].append(value)
    series = [vals[i] for i in xrange(maxval + 1)]
    return series



def average(seq):
    avg = (float(sum(seq)) / len(seq))
    return avg



def standard_dev(seq):
    avg = average(seq)
    sdsq = sum([(i - avg) ** 2 for i in seq])
    try:
        stdev = (sdsq / (len(seq) - 1)) ** .5
    except ZeroDivisionError:
        stdev = 0
    return stdev



def percentile(seq, percentile):
    i = int(len(seq) * (percentile / 100.0))
    seq.sort()
    return seq[i]

if __name__ == '__main__':
    user_group_configs = [UserGroupConfig(num_threads, "group-1", "example_br.py")]
    avg_resptime_points1, percentile_80_resptime_points1, percentile_90_resptime_points1 = output_results(results_dir1, results_file, run_time, rampup, ts_interval, user_group_configs)
    avg_resptime_points2, percentile_80_resptime_points2, percentile_90_resptime_points2 = output_results(results_dir2, results_file, run_time, rampup, ts_interval, user_group_configs)
    resp_graph([avg_resptime_points1, avg_resptime_points2], ("2 servers","1 server"), ["green","red"], "responsetimeavg")
    resp_graph([percentile_80_resptime_points1, percentile_80_resptime_points2], ("2 servers","1 server"), ["green","red"], "responsetime80")
    resp_graph([percentile_90_resptime_points1, percentile_90_resptime_points2], ("2 servers","1 server"), ["green","red"], "responsetime90")
    


