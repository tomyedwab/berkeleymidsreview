"""Process results from user tracking.

Dependencies:
    pip install pyyaml ua-parser user-agents
"""
import csv
from collections import defaultdict
import datetime
import math

from user_agents import parse

users = defaultdict(lambda: {})
conversions = defaultdict(lambda: 0)

columns = [
    # User information
    "User ID",
    "Arrived",

    # Covariates
    "Browser",
    "OS",
    "Device",
    "Mobile?",
    "Source",

    # Treatment
    "Show Disclosure",
    "Show Dialog",

    # Outcomes
    "Dismissed?",
    "Pages Viewed",
    "Max Page Time",
    "Total Page Time",
    "Avg Page Time",
    "Scrolled?",
]

google_signals = [
    "q:utm_source=google",
    "referrer:https://www.google.com",
    "referrer:https://www.google.com/",
    "referrer:http://tpc.googlesyndication.com/safeframe/1-0-4/html/container.html",
]

facebook_signals = [
    "q:utm_source=facebook",
    "referrer:https://www.facebook.com/",
]

with open("output.csv", "r") as f:
    reader = csv.reader(f)
    header = None
    for row in reader:
        if not header:
            header = row
        else:
            values = {k: v for k, v in zip(header, row)}
            if values["ExperimentName"] == "Test":
                users[values['UserId']][values['EventId']] = values

output_rows = []

for user, events in users.iteritems():
    skip = False
    for event in events.values():
        if event['Conversion'] == "q:secret=42" or event['Conversion'] == "q:utm_medium=manually":
            skip = True
            break
    if skip:
        continue

    times = sorted(events.keys())

    output_row = {
        "User ID": user,
        "Arrived": (datetime.datetime
            .fromtimestamp(float(times[0])/1000)
            .strftime('%Y-%m-%d %H:%M:%S')),
        "Browser": "",
        "OS": "",
        "Device": "",
        "Mobile?": False,
        "Show Disclosure": "",
        "Show Dialog": "",
        "Dismissed?": False,
        "Source": "",
        "Max Page Time": 0,
        "Total Page Time": 0,
        "Avg Page Time": 0,
        "Pages Viewed": 0,
        "Scrolled?": False,
    }

    current_max_time = 0

    for time in times:
        event = events[time]
        conversion = event["Conversion"]
        #print "  %s: %s %s" % (time, event['EventTime'], event['Conversion'])

        if conversion.startswith("page_show_"):
            output_row["Show Dialog"] = (
                conversion.split("_")[2] == "dialog")
            output_row["Show Disclosure"] = (
                conversion.split("_")[3] == "full")

        if conversion == "dismissed_message":
            output_row["Dismissed?"] = True

        if conversion in google_signals:
            output_row["Source"] = "Google"
        elif conversion in facebook_signals:
            output_row["Source"] = "Facebook"

        if conversion == "heartbeat":
            output_row["Max Page Time"] = max(
                output_row["Max Page Time"], int(event['EventTime']))
            current_max_time = max(current_max_time, int(event['EventTime']))

        if conversion.startswith("page_view:"):
            if output_row["Pages Viewed"] > 0:
                output_row["Total Page Time"] += current_max_time

            output_row["Pages Viewed"] += 1
            current_max_time = 0

        if conversion == "scroll":
            output_row["Scrolled?"] = True

        if conversion.startswith("agent:"):
            user_agent = parse(conversion[6:])
            output_row["Browser"] = user_agent.browser.family
            output_row["OS"] = user_agent.os.family
            output_row["Device"] = user_agent.device.family
            output_row["Mobile?"] = user_agent.is_mobile

        conversions[conversion] += 1

    if output_row["Pages Viewed"] > 0:
        output_row["Total Page Time"] += current_max_time
        output_row["Avg Page Time"] = output_row["Total Page Time"] / output_row["Pages Viewed"]

    output_row["Total Page Time"] = int(math.floor(output_row["Total Page Time"] / 1000))
    output_row["Max Page Time"] = int(math.floor(output_row["Max Page Time"] / 1000))
    output_row["Avg Page Time"] = int(math.floor(output_row["Avg Page Time"] / 1000))

    output_rows.append(output_row)

with open("processed.csv", "w") as f:
    f.write(",".join(columns) + "\n")
    for row in output_rows:
        f.write(",".join("\"%s\"" % row[col] for col in columns) + "\n")

print "\n".join("%d %s" % (v[1], v[2]) for v in sorted([(k.split(":")[0], v, k) for k, v in conversions.iteritems()]))
