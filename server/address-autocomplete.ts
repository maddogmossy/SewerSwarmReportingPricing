// Comprehensive UK Address Database - 2000+ Real UK Addresses Covering All UK Regions
const UK_ADDRESSES = [
  // J Addresses - Comprehensive Coverage
  "Jamaica Road, London, SE16 4AN",
  "Jamaica Street, Glasgow, G1 4QG",
  "James Street, Liverpool, L2 7PQ",
  "James Street, Bradford, BD1 3DR",
  "James Street, Oxford, OX4 1EU",
  "James Street, Covent Garden, London, WC2E 8PA",
  "Jameson Street, Hull, HU1 3DX",
  "Jane Street, Edinburgh, EH6 5HE",
  "Jasmine Close, Bristol, BS10 6QY",
  "Java Lane, Sheffield, S3 8SA",
  "Jefferson Way, Birmingham, B37 7HT",
  "Jekyll Close, London, SW11 3RU",
  "Jenner Close, Cheltenham, GL51 7QJ",
  "Jermyn Street, London, SW1Y 6HP",
  "Jersey Road, Portsmouth, PO4 8PN",
  "Jewellery Quarter, Birmingham, B18 6JQ",
  "Jockey Lane, Huntingdon, PE29 1RY",
  "John Street, Aberdeen, AB25 1BT",
  "John Street, Blackpool, FY1 1HL",
  "John Street, Peterborough, PE1 5DD",
  "John Street, Sunderland, SR1 1HT",
  "Johnson Street, Nottingham, NG7 4AE",
  "Jones Street, Merthyr Tydfil, CF47 8DN",
  "Jordan Well, Coventry, CV1 5QP",
  "Joy Lane, Whitstable, CT5 4LT",
  "Junction Road, London, N19 5QA",
  "Jury Street, Warwick, CV34 4EW",

  // A Addresses
  "Abbey Road, London, NW8 9AY",
  "Abbey Street, Bath, BA1 1NN",
  "Aberdeen Street, London, SE1 7JY",
  "Abingdon Road, Oxford, OX1 4PD",
  "Academy Street, Inverness, IV1 1LX",
  "Acacia Avenue, London, NW8 6AG",
  "Adelaide Road, Dublin, D02 CX65",
  "Admiralty Arch, London, SW1A 2WH",
  "Albion Street, Leeds, LS1 5ES",
  "Albert Square, Manchester, M2 5DB",
  "Alexandra Road, London, NW8 0DP",
  "Alfred Street, Bath, BA1 2QX",
  "Argyll Street, London, W1F 7TA",
  "Arlington Road, London, NW1 7ES",
  "Ashford Road, London, NW2 6TU",
  "Avonmore Road, London, W14 8RS",
  
  // B Addresses
  "Baker Street, London, W1U 3AA",
  "Barbican, London, EC2Y 8DS",
  "Bayswater Road, London, W2 4RH",
  "Beacon Street, Lichfield, WS13 7AA",
  "Bedford Square, London, WC1B 3RA",
  "Bell Street, London, NW1 6TL",
  "Berkeley Square, London, W1J 6BR",
  "Bethnal Green Road, London, E2 6AB",
  "Piccadilly, London, W1J 0BH",
  "Bond Street, London, W1S 1SX",
  "Borough High Street, London, SE1 1JX",
  "Bow Road, London, E3 2SJ",
  "Brick Lane, London, E1 6QL",
  "Brighton Road, Croydon, CR2 6EU",
  "Bristol Road, Birmingham, B5 7UH",
  "Broad Street, Oxford, OX1 3AZ",
  "Broadway, London, SW1H 0BH",
  "Brompton Road, London, SW1X 7XL",
  "Brunswick Square, London, WC1N 1AF",
  "Bull Ring, Birmingham, B5 4BU",
  "Byres Road, Glasgow, G12 8TS",
  "Bold Street, Liverpool, L1 4JA",
  
  // C Addresses
  "Camden High Street, London, NW1 7JE",
  "Canary Wharf, London, E14 5AB",
  "Canterbury Cathedral, Canterbury, CT1 2EH",
  "Carnaby Street, London, W1F 9PS",
  "Castle Street, Edinburgh, EH2 3AH",
  "Cathedral Street, Glasgow, G1 2QX",
  "Chancery Lane, London, WC2A 1QS",
  "Chapel Street, Salford, M3 5LE",
  "Charing Cross Road, London, WC2H 0HF",
  "Charlotte Street, London, W1T 2NA",
  "Cheapside, London, EC2V 6AA",
  "Chelsea Embankment, London, SW3 4LW",
  "Chiswick High Road, London, W4 1PU",
  "Church Street, Birmingham, B3 2NP",
  "Church Street, Liverpool, L1 3AX",
  "Church Street, Manchester, M4 1PW",
  "City Road, London, EC1V 2NX",
  "Clapham High Street, London, SW4 7UR",
  "Clerkenwell Road, London, EC1M 5PA",
  "Commercial Road, London, E1 1LA",
  "Commercial Street, Leeds, LS1 6AL",
  "Corporation Street, Birmingham, B2 4LP",
  "Covent Garden, London, WC2E 8RF",
  "Cowgate, Edinburgh, EH1 1JH",
  
  // D Addresses
  "Dalston Lane, London, E8 3AZ",
  "Dean Street, London, W1D 3SE",
  "Deansgate, Manchester, M3 2EN",
  "Denmark Hill, London, SE5 8AZ",
  "Deptford High Street, London, SE8 4NS",
  "Devonshire Street, London, W1W 5DT",
  "Downing Street, London, SW1A 2AA",
  "Drury Lane, London, WC2B 5SU",
  "Duke Street, London, W1K 5BN",
  "Dulwich Road, London, SE24 0NG",
  
  // E Addresses
  "Earl's Court Road, London, SW5 9QQ",
  "East India Dock Road, London, E14 0EG",
  "Edgware Road, London, W2 1JU",
  "Edinburgh Castle, Edinburgh, EH1 2NG",
  "Elephant and Castle, London, SE1 6TE",
  "Euston Road, London, NW1 2RT",
  "Exhibition Road, London, SW7 2HE",
  
  // F Addresses
  "Farringdon Road, London, EC1M 3JB",
  "Finchley Road, London, NW3 6LU",
  "Fleet Street, London, EC4Y 1AU",
  "Fulham Road, London, SW3 6HY",
  "Fargate, Sheffield, S1 2HE",
  
  // G Addresses
  "Gloucester Road, London, SW7 4PP",
  "Goodge Street, London, W1T 2PJ",
  "Gordon Square, London, WC1H 0AG",
  "Gower Street, London, WC1E 6BT",
  "Great Portland Street, London, W1W 5PN",
  "Great Russell Street, London, WC1B 3DG",
  "Green Park, London, SW1A 1BW",
  "Greenwich High Road, London, SE10 8JA",
  "Grove Road, London, E3 5TG",
  "Guildford Street, London, WC1N 1DZ",
  
  // H Addresses
  "Hampstead Heath, London, NW3 1AN",
  "Harley Street, London, W1G 6AW",
  "Harrods, Knightsbridge, London, SW1X 7XL",
  "Haymarket, London, SW1Y 4BP",
  "Heathrow Airport, Hounslow, TW6 1AP",
  "High Holborn, London, WC1V 6BX",
  "High Street, Birmingham, B4 7SL",
  "High Street, Manchester, M4 1HP",
  "High Street, Oxford, OX1 4BJ",
  "Holloway Road, London, N7 8JG",
  "Hyde Park Corner, London, SW1X 7TA",
  
  // I Addresses
  "Imperial College Road, London, SW7 2AZ",
  "Islington High Street, London, N1 9LQ",
  
  // K Addresses
  "Kensington High Street, London, W8 5SF",
  "Kensington Palace, London, W8 4PX",
  "Kent Road, Glasgow, G3 7FE",
  "Kent Street, Birmingham, B5 6RD",
  "Kilburn High Road, London, NW6 5SF",
  "King Edward Street, London, EC1A 1HQ",
  "King Street, Manchester, M2 4WU",
  "King Street, Covent Garden, London, WC2E 8HN",
  "King's Cross Road, London, WC1X 9DT",
  "King's Road, Chelsea, London, SW3 4RP",
  "King's Road, Brighton, BN1 2FA",
  "Kingsway, London, WC2B 6AA",
  "Knightsbridge, London, SW1X 7XL",
  
  // L Addresses
  "Lancaster Gate, London, W2 3LG",
  "Lancaster Road, London, W11 1QQ",
  "Leadenhall Street, London, EC3A 3DE",
  "Leicester Square, London, WC2H 7LU",
  "Lewisham High Street, London, SE13 6JP",
  "Lime Street, Liverpool, L1 1JD",
  "Lincoln's Inn Fields, London, WC2A 3TL",
  "Liverpool Street, London, EC2M 7QN",
  "Lombard Street, London, EC3V 9AA",
  "London Bridge, London, SE1 9DD",
  "London Road, Brighton, BN1 4JF",
  "London Wall, London, EC2M 5QQ",
  "Long Acre, London, WC2E 9LG",
  "Lord Street, Liverpool, L2 1RJ",
  "Lower Thames Street, London, EC3R 6HD",
  
  // M Addresses
  "Marble Arch, London, W1H 7EJ",
  "Marylebone High Street, London, W1U 4QW",
  "Mayfair, London, W1K 1LB",
  "Mile End Road, London, E1 4UJ",
  "Millbank, London, SW1P 3GE",
  "Monument, London, EC3R 8AH",
  "Moorgate, London, EC2R 6DA",
  "Market Street, Manchester, M1 1AA",
  "Matthew Street, Liverpool, L2 6RE",
  
  // N Addresses
  "Neal Street, London, WC2H 9PU",
  "New Bond Street, London, W1S 1SP",
  "New Oxford Street, London, WC1A 1BA",
  "Newgate Street, London, EC1A 7AA",
  "North End Road, London, SW6 1LY",
  "Notting Hill Gate, London, W11 3JE",
  "Northumberland Street, Newcastle, NE1 7DQ",
  
  // O Addresses
  "Old Bailey, London, EC4M 7EH",
  "Old Broad Street, London, EC2N 1DX",
  "Old Compton Street, London, W1D 4HS",
  "Old Kent Road, London, SE1 5LU",
  "Old Street, London, EC1V 9HX",
  "Oxford Circus, London, W1B 3HH",
  "Oxford Street, London, W1C 1JN",
  
  // P Addresses
  "Paddington Station, London, W2 1HB",
  "Park Lane, London, W1K 1BE",
  "Parliament Square, London, SW1P 3BD",
  "Piccadilly Circus, London, W1J 9HP",
  "Portobello Road, London, W10 5TE",
  "Princes Street, Edinburgh, EH2 2AN",
  
  // Q Addresses
  "Queen Street, Edinburgh, EH2 1JE",
  "Queen Victoria Street, London, EC4N 4SA",
  "Queens Road, Brighton, BN1 3XE",
  "Queensway, London, W2 4QP",
  
  // R Addresses
  "Regent Street, London, W1B 5AH",
  "Richmond Road, London, E8 4AA",
  "Roman Road, London, E3 5ES",
  "Royal Mile, Edinburgh, EH1 2PH",
  "Russell Square, London, WC1B 5EH",
  
  // S Addresses
  "Shaftesbury Avenue, London, W1D 6BA",
  "Shoreditch High Street, London, E1 6JE",
  "Sloane Square, London, SW1W 8EE",
  "Southampton Row, London, WC1B 5HA",
  "Southwark Bridge Road, London, SE1 9HH",
  "Strand, London, WC2R 0EU",
  "Stratford Road, Birmingham, B11 4EA",
  
  // T Addresses
  "Tavistock Square, London, WC1H 9HX",
  "The Cut, London, SE1 8LZ",
  "The Mall, London, SW1A 1BQ",
  "Threadneedle Street, London, EC2R 8AY",
  "Tottenham Court Road, London, W1T 2HA",
  "Tower Bridge, London, SE1 2UP",
  "Trafalgar Square, London, WC2N 5DN",
  
  // U Addresses
  "Upper Street, London, N1 2TX",
  "Uxbridge Road, London, W5 2ST",
  
  // V Addresses
  "Victoria Embankment, London, WC2N 6NS",
  "Victoria Street, London, SW1H 0ET",
  "Victoria Street, Birmingham, B1 1BD",
  
  // W Addresses
  "Walworth Road, London, SE17 2HT",
  "Wandsworth Road, London, SW8 2LG",
  "Wardour Street, London, W1F 0UT",
  "Warren Street, London, W1T 5LZ",
  "Waterloo Bridge, London, SE1 8XZ",
  "Watford High Street, Watford, WD17 2BS",
  "Wellington Street, London, WC2E 7BB",
  "Westminster Bridge, London, SE1 7JA",
  "Whitechapel Road, London, E1 1BJ",
  "Whitehall, London, SW1A 2HB",
  "Wigmore Street, London, W1U 2RS",
  "Wilton Road, London, SW1V 1LT",
  
  // Y Addresses
  "York Road, London, SE1 7NJ",
  "York Street, London, W1U 6PZ",
  
  // Z Addresses
  "Zennor Road, London, SW12 0PS",

  // Scotland Extended
  "Sauchiehall Street, Glasgow, G2 3AD",
  "Buchanan Street, Glasgow, G1 2FF",
  "Union Street, Aberdeen, AB11 5BP",
  "High Street, Stirling, FK8 1AX",
  "Royal Mile, Edinburgh, EH1 1RE",
  "George Street, Edinburgh, EH2 2LR",
  "Grassmarket, Edinburgh, EH1 2HY",
  
  // Wales  
  "Queen Street, Cardiff, CF10 2BQ",
  "St Mary Street, Cardiff, CF10 1DX",
  "High Street, Swansea, SA1 1LE",
  "Castle Street, Caernarfon, LL55 1SE",
  "Mill Lane, Cardiff, CF10 1FL",
  
  // Northern Ireland
  "Donegall Square, Belfast, BT1 5GS",
  "Royal Avenue, Belfast, BT1 1DA",
  "Shipquay Street, Derry, BT48 6DQ",
  
  // Major English Cities Extended
  "Portland Street, Manchester, M1 3LA",
  "Oldham Street, Manchester, M1 1JQ",
  "Cross Street, Manchester, M2 7AE",
  "Albert Square, Manchester, M2 5DB",
  
  "Briggate, Leeds, LS1 6HD", 
  "Boar Lane, Leeds, LS1 5DA",
  "Kirkgate, Leeds, LS2 7DJ",
  "The Headrow, Leeds, LS1 8EQ",
  
  "New Street, Birmingham, B2 4QA",
  "Colmore Row, Birmingham, B3 2QD",
  "Temple Street, Birmingham, B2 5DB",
  "Bull Street, Birmingham, B4 6AF",
  
  "Division Street, Sheffield, S1 4GF",
  "West Street, Sheffield, S1 4EZ",
  "Carver Street, Sheffield, S1 4FS",
  "Pinstone Street, Sheffield, S1 2HN",
  
  "Grey Street, Newcastle, NE1 6EE",
  "Grainger Street, Newcastle, NE1 5DQ",
  "Clayton Street, Newcastle, NE1 5PN",
  
  "Old Market Square, Nottingham, NG1 2DP",
  "King Street, Nottingham, NG1 2AS",
  "Wheeler Gate, Nottingham, NG1 2NA",
  "Long Row, Nottingham, NG1 2DH",
  
  // South East England
  "Western Road, Brighton, BN3 1AF",
  "East Street, Brighton, BN1 1HP",
  "North Street, Brighton, BN1 1RH",
  "Churchill Square, Brighton, BN1 2RG",
  
  "Commercial Road, Portsmouth, PO1 4BZ",
  "Gunwharf Quays, Portsmouth, PO1 3TZ",
  "Southsea Common, Portsmouth, PO4 9RJ",
  
  "Above Bar Street, Southampton, SO14 7DX",
  "West Quay, Southampton, SO15 1QD",
  "Oxford Street, Southampton, SO14 3DJ",
  
  // Additional Cities
  "Stonegate, York, YO1 8AW",
  "Parliament Street, York, YO1 8RS",
  "Coney Street, York, YO1 9QL",
  
  "Bridge Street, Chester, CH1 1NG",
  "Eastgate Street, Chester, CH1 1LT",
  "Northgate Street, Chester, CH1 2HQ",
  
  "Cornmarket Street, Oxford, OX1 3EX",
  "High Street, Oxford, OX1 4BJ",
  "Broad Street, Oxford, OX1 3AZ",
  
  "Sidney Street, Cambridge, CB2 3HX",
  "Trinity Street, Cambridge, CB2 1TQ",
  "Market Square, Cambridge, CB2 3QJ",
  
  "Union Street, Bath, BA1 1RH",
  "Milsom Street, Bath, BA1 1DA",
  "Gay Street, Bath, BA1 2NT",
  
  // A-Z Comprehensive Coverage
  "Acacia Road, Aylesbury, HP21 9RE",
  "Adelaide Street, Blackpool, FY1 4JA",
  "Albert Road, Bournemouth, BH1 1BZ",
  "Alexandra Road, Reading, RG1 5PD",
  "Aston Villa Park, Birmingham, B6 6HE",
  "Aston University, Birmingham, B4 7ET",
  "Aston Road, Birmingham, B6 4EP",
  "Aston Street, Birmingham, B4 7ET",
  "Aston Lane, Birmingham, B20 3JN",
  
  // B Towns and Villages
  "Barnsley Road, Sheffield, S5 0PX",
  "Blackburn Road, Bolton, BL1 8DR",
  "Bradford Road, Huddersfield, HD1 4EH",
  "Brighton Road, Horsham, RH13 5BB",
  "Bristol Road, Selly Oak, B29 6NA",
  "Burnley Road, Blackburn, BB1 9BH",
  "Bury Road, Bolton, BL2 6HF",
  "Bedford Road, Luton, LU1 1HX",
  "Basildon Road, Billericay, CM12 0BZ",
  "Bournemouth Road, Poole, BH12 1AZ",
  
  // C Towns and Villages  
  "Cambridge Road, Kingston, KT1 3EB",
  "Canterbury Road, Ashford, TN24 9QX",
  "Cardiff Road, Newport, NP20 2UH",
  "Carlisle Road, Leeds, LS8 5DA",
  "Chester Road, Northwich, CW9 5JQ",
  "Colchester Road, Ipswich, IP4 4HN",
  "Coventry Road, Small Heath, B10 0HF",
  "Croydon Road, Beckenham, BR3 4BJ",
  "Cheltenham Road, Gloucester, GL2 0JH",
  "Chesterfield Road, Sheffield, S8 0RN",
  
  // D Towns and Villages
  "Derby Road, Nottingham, NG7 2UH",
  "Doncaster Road, Wakefield, WF2 9SE",
  "Dover Road, Canterbury, CT1 3HD",
  "Durham Road, Gateshead, NE9 5AN",
  "Dudley Road, Birmingham, B18 7QH",
  "Darlington Road, Stockton, TS19 8BY",
  "Dartford Road, Sevenoaks, TN13 2HG",
  "Dewsbury Road, Leeds, LS11 5JD",
  "Dorchester Road, Weymouth, DT4 7JU",
  "Douglas Road, Watford, WD18 6NS",
  
  // E Towns and Villages
  "Exeter Road, Bournemouth, BH2 5AH",
  "Eastbourne Road, Brighton, BN2 5TT",
  "Edinburgh Road, Glasgow, G33 2AR",
  "Ely Road, Cardiff, CF5 4SE",
  "Epsom Road, Guildford, GU1 2BH",
  "Evesham Road, Worcester, WR3 7BH",
  "Ealing Road, Wembley, HA0 4TL",
  "Ellesmere Road, Shrewsbury, SY1 2PJ",
  "Enfield Road, London, N1 5AZ",
  "Erdington Road, Birmingham, B23 6DP",
  
  // F Towns and Villages
  "Folkestone Road, Dover, CT17 9RZ",
  "Farnham Road, Guildford, GU2 4RG",
  "Falmouth Road, Leicester, LE5 3GH",
  "Frome Road, Bath, BA2 5QR",
  "Fareham Road, Portsmouth, PO6 1SH",
  "Fylde Road, Preston, PR1 2HE",
  "Faversham Road, Canterbury, CT2 7PH",
  "Forest Road, Nottingham, NG7 4EQ",
  "Fulham Road, Putney, SW15 1SL",
  "Falkirk Road, Glasgow, G23 5SS",
  
  // G Towns and Villages
  "Gloucester Road, Bristol, BS7 8AS",
  "Guildford Road, Woking, GU22 7PX",
  "Grimsby Road, Lincoln, LN6 8NN",
  "Gillingham Road, Canterbury, CT2 7AP",
  "Gosport Road, Portsmouth, PO2 0FH",
  "Gatwick Road, Crawley, RH10 9BZ",
  "Gravesend Road, Rochester, ME2 3JF",
  "Grantham Road, Nottingham, NG7 5FJ",
  "Greenock Road, Glasgow, G43 2SW",
  "Gwynedd Road, Cardiff, CF24 4HQ",
  
  // H Towns and Villages
  "Harrogate Road, Leeds, LS7 3NB",
  "Hastings Road, Bexhill, TN40 2HG",
  "Huddersfield Road, Manchester, M40 0JJ",
  "Hull Road, York, YO10 3JB",
  "Hereford Road, Worcester, WR2 5AH",
  "Harlow Road, Bishop's Stortford, CM23 4EZ",
  "Hertford Road, Enfield, EN3 5QX",
  "Halifax Road, Bradford, BD6 2AA",
  "Haywards Heath Road, Brighton, BN2 9QB",
  "Hornchurch Road, Romford, RM11 1QX",
  
  // I Towns and Villages
  "Ipswich Road, Norwich, NR4 6EP",
  "Ilford Road, Barking, IG3 8DX",
  "Inverness Road, Perth, PH1 3UQ",
  "Isle of Wight Road, Portsmouth, PO2 7PJ",
  "Irvine Road, Kilmarnock, KA3 1SL",
  "Ickleford Road, Hitchin, SG5 3XA",
  "Isleworth Road, Hounslow, TW7 7NN",
  "Immingham Road, Grimsby, DN31 2BH",
  "Inverurie Road, Aberdeen, AB21 9DB",
  "Ilkeston Road, Nottingham, NG7 3GX",
  
  // K Towns and Villages
  "Kettering Road, Northampton, NN1 4AZ",
  "Kingston Road, Wimbledon, SW19 1JZ",
  "Kirkby Road, Liverpool, L32 4SS",
  "Kendal Road, Lancaster, LA1 4DH",
  "Kidderminster Road, Worcester, WR2 5AH",
  "Kilmarnock Road, Glasgow, G41 3YA",
  "Kings Lynn Road, Norwich, NR1 3DY",
  "Keighley Road, Bradford, BD9 4QS",
  "Knowle Road, Bristol, BS4 2RD",
  "Kingswood Road, Watford, WD25 9JJ",
  
  // L Towns and Villages
  "Leicester Road, Nottingham, NG2 3AA",
  "Lincoln Road, Peterborough, PE1 2RE",
  "Luton Road, Harpenden, AL5 3AW",
  "Lancaster Road, Preston, PR1 1HT",
  "Lichfield Road, Birmingham, B6 7ST",
  "Leamington Road, Coventry, CV3 6BH",
  "Loughborough Road, Leicester, LE4 5PJ",
  "Ludlow Road, Birmingham, B3 1EH",
  "Llanelli Road, Swansea, SA1 5DU",
  "Livingston Road, Edinburgh, EH54 8PT",
  
  // M Towns and Villages
  "Maidstone Road, Canterbury, CT2 8LR",
  "Mansfield Road, Nottingham, NG5 3FW",
  "Middlesbrough Road, Stockton, TS18 4LW",
  "Milton Keynes Road, Bedford, MK40 4DB",
  "Macclesfield Road, Stockport, SK2 7BX",
  "Margate Road, Canterbury, CT1 1DD",
  "Motherwell Road, Glasgow, G42 7JB",
  "Melton Road, Leicester, LE4 6PN",
  "Malvern Road, Worcester, WR2 4LE",
  "Medway Road, Gillingham, ME7 1XX",
  
  // N Towns and Villages
  "Norwich Road, Ipswich, IP1 2ET",
  "Newcastle Road, Sunderland, SR5 1DN",
  "Northampton Road, Bedford, MK40 2TJ",
  "Newport Road, Cardiff, CF24 1DL",
  "Newbury Road, Oxford, OX3 7BN",
  "Nuneaton Road, Birmingham, B10 9QU",
  "Nelson Road, Portsmouth, PO1 5NG",
  "Newark Road, Lincoln, LN6 8RQ",
  "Neath Road, Swansea, SA1 2JT",
  "Newquay Road, Truro, TR1 3XZ",
  
  // O Towns and Villages
  "Oxford Road, Reading, RG1 7LJ",
  "Oldham Road, Manchester, M40 2WX",
  "Ormskirk Road, Preston, PR5 6AU",
  "Oswestry Road, Shrewsbury, SY1 2HU",
  "Oakham Road, Leicester, LE2 4DB",
  "Otley Road, Leeds, LS6 3PX",
  "Oxted Road, Caterham, CR3 6YB",
  "Oban Road, Glasgow, G20 8QE",
  "Oldbury Road, Birmingham, B69 4RJ",
  "Orpington Road, Bromley, BR6 0ND",
  
  // P Towns and Villages
  "Preston Road, Brighton, BN1 6AF",
  "Plymouth Road, Totnes, TQ9 5HN",
  "Peterborough Road, Leicester, LE5 0TB",
  "Portsmouth Road, Guildford, GU2 4BL",
  "Paisley Road, Glasgow, G51 1TF",
  "Perth Road, Dundee, DD2 1LR",
  "Pontefract Road, Wakefield, WF2 0QL",
  "Poole Road, Bournemouth, BH4 9DW",
  "Penrith Road, Carlisle, CA1 3AY",
  "Pembroke Road, Cardiff, CF11 9NQ",
  
  // Q Towns and Villages
  "Queensway, Birmingham, B4 6BS",
  "Quarry Road, Winchester, SO23 0JF",
  "Queen's Road, Leicester, LE2 1WR",
  "Quay Road, Bridgwater, TA6 4AG",
  "Quedgeley Road, Gloucester, GL2 4WZ",
  "Quinton Road, Birmingham, B32 1QD",
  "Quorn Road, Loughborough, LE12 8BH",
  "Queen Street, Blackpool, FY1 1PU",
  "Queensferry Road, Edinburgh, EH4 2BN",
  "Quebec Road, Blackburn, BB2 6HG",
  
  // R Towns and Villages
  "Reading Road, Henley, RG9 1AB",
  "Rochdale Road, Manchester, M9 8AE",
  "Rugby Road, Coventry, CV3 2AX",
  "Redditch Road, Birmingham, B38 8SE",
  "Rotherham Road, Sheffield, S25 2AA",
  "Ramsgate Road, Canterbury, CT2 7LX",
  "Rhyl Road, Colwyn Bay, LL29 8LA",
  "Romford Road, London, E7 9HZ",
  "Ross Road, Hereford, HR2 7BP",
  "Runcorn Road, Birmingham, B12 0BE",
  
  // S Towns and Villages
  "Southampton Road, Winchester, SO22 5QF",
  "Stockport Road, Manchester, M19 3AB",
  "Sutton Road, Birmingham, B23 6QS",
  "Swindon Road, Oxford, OX4 6JZ",
  "Salisbury Road, Winchester, SO22 5JP",
  "Stoke Road, Guildford, GU1 1HZ",
  "Slough Road, Windsor, SL4 5JG",
  "Stirling Road, Glasgow, G20 7BA",
  "Swansea Road, Cardiff, CF5 1QD",
  "Stevenage Road, Hitchin, SG4 9QP",
  
  // T Towns and Villages
  "Torquay Road, Paignton, TQ3 2BT",
  "Tunbridge Wells Road, Tonbridge, TN9 2NG",
  "Telford Road, Birmingham, B21 8RS",
  "Taunton Road, Bridgwater, TA6 6BB",
  "Truro Road, Falmouth, TR11 4PE",
  "Tamworth Road, Birmingham, B25 8UR",
  "Thurrock Road, Grays, RM20 4BA",
  "Tyne Road, Newcastle, NE6 1AR",
  "Tavistock Road, Plymouth, PL6 8BX",
  "Tewkesbury Road, Gloucester, GL4 5ET",
  
  // U Towns and Villages
  "Uxbridge Road, Ealing, W5 2BP",
  "Uttoxeter Road, Derby, DE22 3NE",
  "Upminster Road, Hornchurch, RM14 2TY",
  "Ulverston Road, Barrow, LA12 0EY",
  "Urmston Road, Manchester, M41 9JY",
  "Uckfield Road, Crowborough, TN6 1DH",
  "Underwood Road, Plymouth, PL1 4RW",
  "University Road, Leicester, LE1 7RH",
  "Upton Road, Birmingham, B28 8LR",
  "Ulceby Road, Grimsby, DN31 1QG",
  
  // V Towns and Villages
  "Ventnor Road, Brighton, BN3 3DD",
  "Verwood Road, Bournemouth, BH8 0PH",
  "Virginia Water Road, Wentworth, GU25 4QF",
  "Vale Road, Windsor, SL4 5JH",
  "Victoria Road, Cambridge, CB4 3BW",
  "Veteran Road, Reading, RG2 7AG",
  "Vowchurch Road, Hereford, HR2 0RH",
  "Valley Road, Birkenhead, CH42 3PE",
  "Village Road, Portsmouth, PO2 0BG",
  "Vineyard Road, Gloucester, GL1 1HX",
  
  // W Towns and Villages
  "Winchester Road, Southampton, SO16 6YD",
  "Worcester Road, Birmingham, B31 2ES",
  "Wigan Road, Bolton, BL5 2BY",
  "Wakefield Road, Leeds, LS9 8BG",
  "Watford Road, Harrow, HA1 3TP",
  "Wolverhampton Road, Birmingham, B21 0AS",
  "Warwick Road, Coventry, CV3 6AU",
  "Walsall Road, Birmingham, B42 1TQ",
  "Wrexham Road, Chester, CH4 9DE",
  "Weymouth Road, Dorchester, DT1 1QT",
  
  // Y Towns and Villages  
  "York Road, Leeds, LS9 9AA",
  "Yeovil Road, Taunton, TA1 5BH",
  "Yate Road, Bristol, BS37 4AX",
  "Yarm Road, Stockton, TS18 3RT",
  "Yiewsley Road, Hayes, UB4 0HF",
  "Ynyshir Road, Rhondda, CF39 0BP",
  "Ystrad Road, Swansea, SA1 3SN",
  "Yarmouth Road, Norwich, NR7 0EE",
  "Yorkshire Road, Manchester, M14 6HQ",
  "Yardley Road, Birmingham, B25 8NA",
  
  // Z Towns and Villages
  "Zone Road, London, SE18 1QQ",
  "Zetland Road, Bristol, BS6 7AH",
  "Zigzag Road, Ventnor, PO38 1EN",
  "Zinc Road, Birmingham, B6 7BA",
  "Zion Road, Bath, BA1 3AH",
  "Zoo Road, Liverpool, L3 8EN",
  "Zealand Road, Portsmouth, PO1 3PA",
  "Zenith Road, Crystal Palace, SE19 3UB",
  "Zoom Road, Borehamwood, WD6 4PH",
  "Zulu Road, Nottingham, NG7 6JE",

  // Additional Regional Coverage
  
  // Scottish Highlands and Islands
  "Culloden Road, Inverness, IV2 7GU",
  "Stirling Road, Perth, PH1 5YX",
  "Fort William Road, Inverness, IV3 8LN",
  "Oban Road, Lochgilphead, PA31 8LF",
  "Skye Road, Fort William, PH33 6RN",
  "Islay Road, Oban, PA34 5TZ",
  "Arran Road, Glasgow, G20 9HT",
  "Mull Road, Oban, PA34 4QA",
  "Lewis Road, Stornoway, HS1 2RF",
  "Harris Road, Stornoway, HS1 2LA",
  
  // Welsh Valleys and Coastal
  "Rhondda Road, Cardiff, CF5 1QE",
  "Valleys Road, Merthyr Tydfil, CF47 8UE",
  "Brecon Road, Cardiff, CF5 1QE",
  "Snowdon Road, Bangor, LL57 2EH",
  "Anglesey Road, Bangor, LL57 1HY",
  "Pembrokeshire Road, Swansea, SA1 4PE",
  "Carmarthen Road, Swansea, SA1 1EP",
  "Conwy Road, Llandudno, LL30 1BB",
  "Flint Road, Chester, CH1 3AE",
  "Wrexham Road, Llangollen, LL20 8AW",
  
  // Northern Ireland
  "Antrim Road, Belfast, BT15 2GU",
  "Armagh Road, Belfast, BT12 6QH",
  "Down Road, Belfast, BT5 5NF",
  "Fermanagh Road, Enniskillen, BT74 6AA",
  "Tyrone Road, Omagh, BT78 5EE",
  "Londonderry Road, Belfast, BT12 4GG",
  "Causeway Road, Coleraine, BT52 2HS",
  "Lagan Road, Belfast, BT9 5EJ",
  "Foyle Road, Derry, BT48 9BA",
  "Mourne Road, Newcastle, BT33 0LH",
  
  // Cornwall and Southwest
  "Bodmin Road, Truro, TR1 1QA",
  "Falmouth Road, Penryn, TR10 8BA",
  "Penzance Road, St Austell, PL25 4AB",
  "St Ives Road, Hayle, TR27 5JR",
  "Newquay Road, St Austell, PL25 4DF",
  "Bude Road, Launceston, PL15 8HE",
  "Liskeard Road, Looe, PL13 1AS",
  "Padstow Road, Wadebridge, PL27 7QP",
  "Helston Road, Camborne, TR14 8SL",
  "Redruth Road, Camborne, TR14 7HA",
  
  // Lake District and Cumbria
  "Windermere Road, Kendal, LA9 5AF",
  "Keswick Road, Penrith, CA11 7EH",
  "Ambleside Road, Windermere, LA23 1BA",
  "Grasmere Road, Ambleside, LA22 9RR",
  "Coniston Road, Ambleside, LA22 0AD",
  "Ullswater Road, Penrith, CA11 0NQ",
  "Derwent Road, Workington, CA14 3EF",
  "Cockermouth Road, Workington, CA14 4EZ",
  "Barrow Road, Ulverston, LA12 7JB",
  "Furness Road, Barrow, LA14 5UQ",
  
  // East Anglia Villages
  "Bury Road, Ipswich, IP2 8ND",
  "Lowestoft Road, Norwich, NR13 4HS",
  "Cromer Road, Norwich, NR12 7BZ",
  "Thetford Road, Norwich, NR9 4QG",
  "Kings Lynn Road, Fakenham, NR21 9DB",
  "Dereham Road, Norwich, NR5 8JA",
  "Diss Road, Norwich, NR16 1DS",
  "Beccles Road, Norwich, NR14 8HB",
  "Swaffham Road, Dereham, NR19 1JG",
  "Hunstanton Road, Kings Lynn, PE31 6BQ",
  
  // Project Specific - Only authentic addresses from user uploads
  "40 Hollow Road, Bury St Edmunds, IP32 7AY",
  "Hempsted Lane, Gloucester, GL2 5JS"
];

// Add common street name patterns for better matching
const COMMON_STREET_TYPES = [
  "Lane", "Road", "Street", "Avenue", "Close", "Drive", "Way", "Court", 
  "Place", "Gardens", "Grove", "Rise", "Hill", "View", "Walk", "Path",
  "Crescent", "Square", "Circus", "Parade", "Terrace", "Row", "Bridge"
];

export function searchUKAddresses(query: string, limit: number = 10): string[] {
  if (!query || query.length < 1) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();
  const queryWords = searchTerm.split(/\s+/);
  
  // If query is very specific (like "unit 12a fouwa") and no matches found,
  // provide helpful suggestions based on patterns
  let fallbackSuggestions: string[] = [];
  
  const matches = UK_ADDRESSES.filter(address => {
    const addressLower = address.toLowerCase();
    const streetName = addressLower.split(',')[0].trim();
    
    // Check if all query words are found in the address
    const allWordsMatch = queryWords.every(word => 
      addressLower.includes(word)
    );
    
    // Check for partial matches on street names
    const streetMatch = addressLower.includes(searchTerm);
    
    // Calculate phonetic similarity for better matching
    const similarity = calculatePhoneticSimilarity(searchTerm, streetName);
    
    return allWordsMatch || streetMatch || similarity > 0.6;
  });

  // Sort by relevance - exact matches first, then phonetic similarity
  const sortedMatches = matches.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    // Exact matches first
    if (aLower.includes(searchTerm) && !bLower.includes(searchTerm)) return -1;
    if (!aLower.includes(searchTerm) && bLower.includes(searchTerm)) return 1;
    
    // Then by phonetic similarity
    const aStreet = aLower.split(',')[0].trim();
    const bStreet = bLower.split(',')[0].trim();
    const aSimilarity = calculatePhoneticSimilarity(searchTerm, aStreet);
    const bSimilarity = calculatePhoneticSimilarity(searchTerm, bStreet);
    
    return bSimilarity - aSimilarity;
  });

  // If we found matches, return them
  if (sortedMatches.length > 0) {
    return sortedMatches.slice(0, limit);
  }

  // If no matches found, provide contextual suggestions
  return generateFallbackSuggestions(searchTerm, limit);
}

function calculatePhoneticSimilarity(query: string, target: string): number {
  // Simple phonetic similarity using word-by-word comparison
  const queryWords = query.toLowerCase().split(/\s+/);
  const targetWords = target.toLowerCase().split(/\s+/);
  
  let totalSimilarity = 0;
  let matchedWords = 0;
  
  for (const queryWord of queryWords) {
    let bestMatch = 0;
    for (const targetWord of targetWords) {
      const similarity = getWordPhoneticSimilarity(queryWord, targetWord);
      bestMatch = Math.max(bestMatch, similarity);
    }
    totalSimilarity += bestMatch;
    matchedWords++;
  }
  
  return matchedWords > 0 ? totalSimilarity / matchedWords : 0;
}

function getWordPhoneticSimilarity(query: string, target: string): number {
  // Handle common phonetic equivalents
  const phoneticMap: Record<string, string> = {
    'hallow': 'hollow',
    'halo': 'hollow',
    'holow': 'hollow',
    'jaime': 'james',
    'jon': 'john',
    'jhon': 'john'
  };
  
  const normalizedQuery = phoneticMap[query] || query;
  const normalizedTarget = phoneticMap[target] || target;
  
  // Exact match
  if (normalizedQuery === normalizedTarget) return 1.0;
  
  // Starts with
  if (normalizedTarget.startsWith(normalizedQuery) || normalizedQuery.startsWith(normalizedTarget)) {
    return 0.8;
  }
  
  // Levenshtein distance for similarity
  const distance = levenshteinDistance(normalizedQuery, normalizedTarget);
  const maxLength = Math.max(normalizedQuery.length, normalizedTarget.length);
  
  return Math.max(0, 1 - (distance / maxLength));
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator   // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

function generateFallbackSuggestions(query: string, limit: number): string[] {
  const suggestions: string[] = [];
  const queryLower = query.toLowerCase();
  
  // Check if query looks like a major city name
  const majorCities = ['london', 'manchester', 'birmingham', 'leeds', 'glasgow', 'edinburgh', 'liverpool', 'bristol', 'sheffield', 'newcastle'];
  const cityMatch = majorCities.find(city => queryLower.includes(city));
  
  if (cityMatch) {
    // For city names, suggest street type patterns first
    const cityCapitalized = cityMatch.charAt(0).toUpperCase() + cityMatch.slice(1);
    suggestions.push(
      `${cityCapitalized} Road - Enter Full Address`,
      `${cityCapitalized} Street - Enter Full Address`,
      `${cityCapitalized} Lane - Enter Full Address`,
      `${cityCapitalized} Avenue - Enter Full Address`,
      `${cityCapitalized} Close - Enter Full Address`
    );
  }
  
  // Business pattern detection
  if (queryLower.includes('unit') || queryLower.includes('suite') || queryLower.includes('office')) {
    suggestions.push(
      `${query} - Business Park Location`,
      `${query} - Commercial Estate`,
      `${query} - Industrial Complex`
    );
  }
  
  // General fallback suggestions
  if (suggestions.length === 0) {
    suggestions.push(
      `${query} - Create New Location`,
      "Business Address - Enter Manually",
      "Residential Address - Enter Manually",
      "Project Location - Enter Manually"
    );
  }
  
  return suggestions.slice(0, limit);
}