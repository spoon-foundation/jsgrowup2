"""
Usage: python munge_data.py

For each of the WHO data files, parse, translate, and save each out to a new
data structure (a new module per file).
"""
import csv
import json

MALE = "1"
FEMALE = "2"


def parse_files(file_names):
    """Parse a list of CSVs and return their combined data.

    Returns a dict like {
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
    results = {
        "male": {},
        "female": {},
        }
    for file_name in file_names:
        if "boy" in file_name:
            sex = "male"
        elif "girl" in file_name:
            sex = "female"
        else:
            raise Exception("Indeterminate sex for file '%s'" % file_name)
        with open(file_name) as f:
            reader = csv.DictReader(f, delimiter="\t")
            for row in reader:
                t = int(row["Month"])
                data = {
                    "l": row["L"],
                    "m": row["M"],
                    "s": row["S"],
                    }
                results[sex][t] = data
    return results


# For ages (0-5) where we already have daily data, we ignore their monthly
# versions.
output_input = (
    ("bmifa", (
        # "bmi_boys_0_2_zcores.txt",
        # "bmi_boys_2_5_zscores.txt",
        "bmi_boys_z_WHO2007_exp.txt",
        # "bmi_girls_0_2_zscores.txt",
        # "bmi_girls_2_5_zscores.txt",
        "bmi_girls_z_WHO2007_exp.txt",
        )
     ),
    # ("hcfa.ts", (
    #     "tab_hcfa_boys_z_0_5.txt",
    #     "tab_hcfa_girls_z_0_5.txt",
    #     )
    # ),
    ("lfa", (
        "hfa_boys_z_WHO2007_exp.txt",
        "hfa_girls_z_WHO2007_exp.txt",
        # "lhfa_boys_0_2_zscores.txt",
        # "lhfa_boys_2_5_zscores.txt",
        # "lhfa_girls_0_2_zscores.txt",
        # "lhfa_girls_2_5_zscores.txt",
        )
     ),
    # ("ssfa.ts", (
    #     "tab_ssfa_boys_z_3_5.txt",
    #     "tab_ssfa_girls_z_3_5.txt",
    #     )
    # ),
    # ("tsfa.ts", (
    #     "tab_tsfa_boys_z_3_5.txt",
    #     "tab_tsfa_girls_z_3_5.txt",
    #     )
    # ),
    ("wfa", (
        # "wfa_boys_0_5_zscores.txt",
        "wfa_boys_z_WHO2007_exp.txt",
        # "wfa_girls_0_5_zscores.txt",
        "wfa_girls_z_WHO2007_exp.txt",
        )
     ),
    # ("wfh.ts", (
    #     "wfh_boys_2_5_zscores.txt",
    #     )
    # ),
    # ("wfl.ts", (
    #     "wfl_boys_0_2_zscores.txt",
    #     )
    #  ),
    )

template = """
import { Decimal } from "decimal.js-light";

export const DATA = {
"""

for out_fname, in_fnames in output_input:
    parsed = parse_files(in_fnames)
    with open(f"../by_month_{out_fname}.json", "w") as out_file:
        print(json.dumps(parsed), file=out_file)
        # print(template, file=out_file)
        # for sex, months in parsed.items():
        #     print("  %s: { " % sex, file=out_file)
        #     for month, rows in months.items():
        #         print("    %s: { " % month, end="", file=out_file)
        #         for key, value in rows.items():
        #             print(f"{key}: new Decimal('{value}'), ", end="", file=out_file)
        #         print(" }, ", file=out_file)
        #     print(" }, ", file=out_file)
        # print(" }", file=out_file)
