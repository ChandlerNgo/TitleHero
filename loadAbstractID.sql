LOAD DATA LOCAL INFILE '/home/chandler-ngo/Desktop/Capstone/TitleHero/python/output_abstract.csv'
INTO TABLE Abstract
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 0 ROWS
(abstractCode, name);
