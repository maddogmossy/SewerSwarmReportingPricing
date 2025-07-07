// UK Address Autocomplete using common UK addresses
const UK_ADDRESSES = [
  // Major cities and landmarks
  "Birmingham City Centre, Victoria Square, Birmingham, B1 1BB",
  "London Bridge, 21 London Bridge St, London, SE1 9SG",
  "Manchester City Centre, Albert Square, Manchester, M2 5DB",
  "Leeds City Centre, City Square, Leeds, LS1 2RP",
  "Glasgow City Centre, George Square, Glasgow, G2 1DU",
  "Edinburgh Old Town, Royal Mile, Edinburgh, EH1 1RF",
  "Liverpool City Centre, Lime Street, Liverpool, L1 1JD",
  "Sheffield City Centre, Town Hall, Sheffield, S1 2HH",
  "Bristol City Centre, Cabot Circus, Bristol, BS1 3BX",
  "Newcastle City Centre, Grey Street, Newcastle, NE1 6EE",
  "Nottingham City Centre, Market Square, Nottingham, NG1 2DP",
  "Leicester City Centre, Town Hall Square, Leicester, LE1 9BG",
  "Coventry City Centre, Broadgate, Coventry, CV1 1NH",
  "Bradford City Centre, City Hall, Bradford, BD1 1HY",
  "Portsmouth Historic Dockyard, Portsmouth, PO1 3LJ",
  "Brighton City Centre, Churchill Square, Brighton, BN1 2RG",
  "Oxford City Centre, Carfax Tower, Oxford, OX1 1ET",
  "Cambridge City Centre, Market Square, Cambridge, CB2 3QJ",
  "Bath City Centre, Roman Baths, Bath, BA1 1LZ",
  "York City Centre, Minster Yard, York, YO1 7HH",
  "Canterbury City Centre, High Street, Canterbury, CT1 2JE",
  "Chester City Centre, Rows, Chester, CH1 1NW",
  "Stratford-upon-Avon, Henley Street, Stratford-upon-Avon, CV37 6QW",
  "Windsor Castle, Windsor, SL4 1NJ",
  "St Albans City Centre, French Row, St Albans, AL3 5DU",
  "Warwick Castle, Warwick, CV34 4QU",
  
  // Project specific addresses
  "Bowbridge Lane, Newark, NG24 3BY",
  "Nine Elms Park, Vauxhall, London, SW8 5BX",
  
  // Common street names
  "High Street, Birmingham, B4 7SL",
  "High Street, Manchester, M4 1HP",
  "High Street, Leeds, LS1 6AG",
  "High Street, Liverpool, L2 3YL",
  "High Street, Newcastle, NE1 6JQ",
  "High Street, Sheffield, S1 2GA",
  "High Street, Bristol, BS1 2AA",
  "High Street, Nottingham, NG1 2GA",
  "High Street, Leicester, LE1 4FQ",
  
  "Victoria Street, Westminster, London, SW1H 0ET",
  "Victoria Street, Birmingham, B1 1BD",
  "Victoria Street, Manchester, M3 1GA",
  "Victoria Street, Leeds, LS1 6AD",
  "Victoria Street, Liverpool, L1 6AD",
  
  "Church Street, Birmingham, B3 2NP",
  "Church Street, Manchester, M4 1PW",
  "Church Street, Liverpool, L1 3AX",
  "Church Street, Leeds, LS2 7DJ",
  "Church Street, Sheffield, S1 1HA",
  
  "Station Road, Birmingham, B5 4DY",
  "Station Road, Manchester, M12 6JH",
  "Station Road, Leeds, LS1 4DY",
  "Station Road, Liverpool, L3 8EG",
  "Station Road, Newcastle, NE4 7YH",
  
  "Queen Street, Birmingham, B1 3JN",
  "Queen Street, Leeds, LS1 2TW",
  "Queen Street, Liverpool, L1 1RG",
  "Queen Street, Sheffield, S1 2DX",
  "Queen Street, Newcastle, NE1 1UG",
  
  "King Street, Manchester, M2 4WU",
  "King Street, Leeds, LS1 2HH",
  "King Street, Liverpool, L1 9AX",
  "King Street, Sheffield, S1 2HE",
  "King Street, Newcastle, NE1 1HP",
  
  "Market Street, Manchester, M1 1AA",
  "Market Street, Leeds, LS1 6DT",
  "Market Street, Liverpool, L2 5PX",
  "Market Street, Sheffield, S1 2PH",
  "Market Street, Newcastle, NE1 6JE",
  
  "Mill Lane, Birmingham, B12 0XF",
  "Mill Lane, Manchester, M20 6RD",
  "Mill Lane, Leeds, LS10 2RU",
  "Mill Lane, Liverpool, L13 7HF",
  "Mill Lane, Sheffield, S6 2GA",
  
  "Park Road, Birmingham, B13 8DH",
  "Park Road, Manchester, M14 5GL",
  "Park Road, Leeds, LS11 5TD",
  "Park Road, Liverpool, L8 4UB",
  "Park Road, Sheffield, S2 3QQ",
  
  // Scotland
  "Princess Street, Edinburgh, EH2 2BY",
  "Buchanan Street, Glasgow, G1 2FF",
  "Union Street, Aberdeen, AB11 6BD",
  "Perth Road, Dundee, DD1 4HN",
  
  // Wales
  "Queen Street, Cardiff, CF10 2BQ",
  "High Street, Swansea, SA1 1NW",
  "Castle Street, Caernarfon, LL55 2AY",
  
  // Specific locations
  "Bold Street, Liverpool, L1 4JA",
  "Fargate, Sheffield, S1 2HE",
  "Park Street, Bristol, BS1 5HX",
  "Northumberland Street, Newcastle, NE1 7DQ",
  "Gallowtree Gate, Leicester, LE1 5AD",
  "Hertford Street, Coventry, CV1 1LF",
  "Commercial Road, Portsmouth, PO1 4BZ",
  "North Street, Brighton, BN1 1RH",
  "Cornmarket Street, Oxford, OX1 3EX",
  "Sidney Street, Cambridge, CB2 3HX",
  "Union Street, Bath, BA1 1RH",
  "Stonegate, York, YO1 8ZW",
  "Bridge Street, Chester, CH1 1NG",
];

export function searchUKAddresses(query: string, limit: number = 10): string[] {
  if (!query || query.length < 1) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();
  const queryWords = searchTerm.split(/\s+/);
  
  const matches = UK_ADDRESSES.filter(address => {
    const addressLower = address.toLowerCase();
    
    // Check if all query words are found in the address
    const allWordsMatch = queryWords.every(word => 
      addressLower.includes(word)
    );
    
    // Also check for partial matches on street names
    const streetMatch = addressLower.includes(searchTerm);
    
    return allWordsMatch || streetMatch;
  });

  // Advanced relevance scoring
  matches.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    // Exact start match gets highest priority
    if (aLower.startsWith(searchTerm) && !bLower.startsWith(searchTerm)) return -1;
    if (!aLower.startsWith(searchTerm) && bLower.startsWith(searchTerm)) return 1;
    
    // Street name start match gets next priority
    const aStreetStart = aLower.split(',')[0].startsWith(searchTerm);
    const bStreetStart = bLower.split(',')[0].startsWith(searchTerm);
    if (aStreetStart && !bStreetStart) return -1;
    if (!aStreetStart && bStreetStart) return 1;
    
    // Word boundary matches
    const aWordMatch = queryWords.every(word => 
      new RegExp(`\\b${word}`, 'i').test(a)
    );
    const bWordMatch = queryWords.every(word => 
      new RegExp(`\\b${word}`, 'i').test(b)
    );
    if (aWordMatch && !bWordMatch) return -1;
    if (!aWordMatch && bWordMatch) return 1;
    
    return a.localeCompare(b);
  });

  return matches.slice(0, limit);
}