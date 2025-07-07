// UK Address Autocomplete using common UK addresses
const UK_ADDRESSES = [
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
  "Bowbridge Lane, Newark, NG24 3BY",
  "Nine Elms Park, Vauxhall, London, SW8 5BX",
  "High Street, Birmingham, B4 7SL",
  "Victoria Street, Westminster, London, SW1H 0ET",
  "Princess Street, Manchester, M1 6DE",
  "Briggate, Leeds, LS1 6HD",
  "Buchanan Street, Glasgow, G1 2FF",
  "Princes Street, Edinburgh, EH2 2BY",
  "Bold Street, Liverpool, L1 4JA",
  "Fargate, Sheffield, S1 2HE",
  "Park Street, Bristol, BS1 5HX",
  "Northumberland Street, Newcastle, NE1 7DQ",
  "King Street, Nottingham, NG1 2AS",
  "Gallowtree Gate, Leicester, LE1 5AD",
  "Hertford Street, Coventry, CV1 1LF",
  "Darley Street, Bradford, BD1 3HN",
  "Commercial Road, Portsmouth, PO1 4BZ",
  "North Street, Brighton, BN1 1RH",
  "Cornmarket Street, Oxford, OX1 3EX",
  "Sidney Street, Cambridge, CB2 3HX",
  "Union Street, Bath, BA1 1RH",
  "Stonegate, York, YO1 8ZW",
  "Burgate, Canterbury, CT1 2HJ",
  "Bridge Street, Chester, CH1 1NG",
];

export function searchUKAddresses(query: string, limit: number = 10): string[] {
  if (!query || query.length < 2) {
    return [];
  }

  const searchTerm = query.toLowerCase();
  const matches = UK_ADDRESSES.filter(address =>
    address.toLowerCase().includes(searchTerm)
  );

  // Sort by relevance (starts with query first)
  matches.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    if (aLower.startsWith(searchTerm) && !bLower.startsWith(searchTerm)) return -1;
    if (!aLower.startsWith(searchTerm) && bLower.startsWith(searchTerm)) return 1;
    return a.localeCompare(b);
  });

  return matches.slice(0, limit);
}