"""
Usage: python munge_data.py

For each of the WHO data files, parse, translate, and save each out to a new
data structure (a new module per file).
"""
import csv

MALE = "1"
FEMALE = "2"


def parse_file(file_name):
    """Parse a CSV and return a data structure of its contents.
    CSV's header row should contain: sex, age (or height), l, m, s.

    Returns an object like {
        "male": {
            1: {"l": value, "m": value, "s": value},
            2: {"l": value, "m": value, "s": value},
            etc,
            },
        "female": {
            1: {"l": value, "m": value, "s": value},
            2: {"l": value, "m": value, "s": value},
            etc,
            },
        }
    (The keys that are numbers represent "t": days or length/height.)

    Note that flags indicating "L" or "H" are dropped.
    """
    with open(file_name) as f:
        results = {
            "male": {},
            "female": {},
            }
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            sex = row["sex"]
            if "age" in row:
                t = int(row["age"])
            elif "height" in row:
                t = row["height"]
            else:
                t = row["length"]
            data = {
                "l": row["l"],
                "m": row["m"],
                "s": row["s"],
                }
            if sex == MALE:
                results["male"][t] = data
            elif sex == FEMALE:
                results["female"][t] = data
    return results


output_input = (
    ("acfa.ts", "arm_circumference_for_age.txt"),
    ("bmifa.ts", "bmi_for_age.txt"),
    ("hcfa.ts", "head_circumference_for_age.txt"),
    ("lfa.ts", "length_for_age.txt"),
    ("wfa.ts", "weight_for_age.txt"),
    ("wfh.ts", "weight_for_height.txt"),
    ("wfl.ts", "weight_for_length.txt"),
    )

template = """
import { Decimal } from "decimal.js";

export const DATA = {
"""

for out_fname, in_fname in output_input:
    parsed = parse_file(in_fname)
    with open("../%s" % out_fname, "w") as out_file:
        print(template, file=out_file)
        for sex, months in parsed.items():
            print("  %s: { " % sex, file=out_file)
            for month, rows in months.items():
                print("    %s: { " % month, end="", file=out_file)
                for key, value in rows.items():
                    print(f"{key}: new Decimal('{value}'), ", end="", file=out_file)
                print(" }, ", file=out_file)
            print(" }, ", file=out_file)
        print(" }", file=out_file)
