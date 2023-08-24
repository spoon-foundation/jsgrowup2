"""
Usage: python munge_data.py

For each of the data files, parse, translate, and save each out to a new
data structure (a new module per file).
"""
import csv


HEADER_MAP_1 = {
    "id": "id",
    "sex": "GENDER",
    "headCircumference": "HEAD",
    "height": "HEIGHT",
    "armCircumference": "MUAC",
    "weight": "WEIGHT",
    "ageInDays": "age.days",
    "ageInMonths": "agemons",
    "bmi": "cbmi",
    "lOrH": "measure",
    "acfaZ": "zac",
    "bmifaZ": "zbmi",
    "hcfaZ": "zhc",
    "lfaZ": "zlen",
    "wfaZ": "zwei",
    "wflZ": "zwfl",
}

HEADER_MAP_2 = {
    "id": "id",
    "sex": "sex",
    "dob": "dob",
    "ageInMonths": "agemons",
    "headCircumference": "head",
    "lfaZ": "_zhfa",  # >= 5
    "lfaZ2": "_zlen",  # under 5
    "hcfaZ": "_zhc",
    "bmifaZ": "_zbfa",  # under 5
    "dateOfObservation": "screen_date",
    "wfaZ": "_zwfa",  # >= 5
    "wfaZ2": "_zwei",  # under 5
    "bmifaZ2": "_zbmi",  # >= 5
    "bmi": "_cbmi",
    "height": "height",
    "weight": "weight",
    "wflZ": "_zwfl",
}

INT_FIELDS = {
    "id",
    "ageInDays",
}

FLOAT_FIELDS = {
    "ageInMonths",
    "headCircumference",
    "height",
    "armCircumference",
    "weight",
    "bmi",
    "acfaZ",
    "bmifaZ",
    "hcfaZ",
    "lfaZ",
    "wfaZ",
    "wflZ",
}

SEX_MAP = {
    "1": "male",
    "2": "female",
    "Male": "male",
    "Female": "female",
}


def parse_file(file_name, header_map):
    results = []
    with open(file_name) as f:
        reader = csv.DictReader(f)
        for row in reader:
            sample = {}
            for new_name, old_name in header_map.items():
                sample[new_name] = row[old_name]
                if new_name in FLOAT_FIELDS:
                    try:
                        sample[new_name] = float(sample[new_name])
                    except ValueError:
                        pass
                elif new_name in INT_FIELDS:
                    sample[new_name] = int(sample[new_name])
            sample["sex"] = SEX_MAP[sample["sex"]]
            results.append(sample)
    return results


output_input = (
    ("data_who.js", "MySurvey_z_st.csv", HEADER_MAP_1),
    ("data_spoon.js", "test_dataset.csv", HEADER_MAP_2),
    )

template = """export const DATA = ["""

for out_fname, in_fname, header_map in output_input:
    parsed = parse_file(in_fname, header_map)
    with open("../%s" % out_fname, "w") as out_file:
        print(template, file=out_file)
        for row in parsed:
            print("  " + str(row) + ",", file=out_file)
            # print("  { ", end="", file=out_file)
            # for key, value in row.items():
            #     print("    %s: { " % month, end="", file=out_file)
            #     for key, value in rows.items():
            #         print(f"{key}: new Decimal('{value}'), ", end="", file=out_file)
            #     print(" }, ", file=out_file)
            # print(" }, ", file=out_file)
        print(" ]", file=out_file)
