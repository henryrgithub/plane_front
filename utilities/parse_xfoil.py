import csv

filename = input('Please enter the filename of the xfoil generated airfoil data: ')

with open(filename, newline='') as file:
  reader = csv.DictReader(file, fieldnames = ("alpha","CL",
                                              "CD","CDp","CM",
                                              "Top_Xtr","Bot_Xtr"),
                          delimiter=' ',
                          skipinitialspace=True)
  for _ in range(12):
    next(reader)
  CDholder = []
  CMholder = []
  for line in reader:
    print("[" + line["alpha"] + "," + line["CL"] + "],")
    CDholder.append("[" + line["alpha"] + "," + line["CD"] + "],")
    CMholder.append("[" + line["alpha"] + "," + line["CM"] + "],")
  for line in CDholder:
    print(line)
  for line in CMholder:
    print(line)
#reader = csv.reader(file,delimiter="\t")
#for line in reader:
  #print(line)

