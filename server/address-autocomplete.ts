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
  
  // Project specific addresses will be added only from authentic user uploads
  "Industrial Estate, Location TBD",
  "Infrastructure Site, Location TBD",
  
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
  
  // Additional comprehensive UK streets
  "Hempsted Lane, Gloucester, GL2 5JS",
  "Hollow Road, Bury St Edmunds, IP32 7AY",
  "Abbey Road, London, NW8 9AY",
  "Baker Street, London, NW1 6XE",
  "Carnaby Street, London, W1F 9PS",
  "Downing Street, London, SW1A 2AA",
  "Fleet Street, London, EC4Y 1AU",
  "Jermyn Street, London, SW1Y 6HP",
  "Oxford Street, London, W1C 1JN",
  "Piccadilly, London, W1J 0BH",
  "Regent Street, London, W1B 5AH",
  "The Strand, London, WC2R 0EU",
  "Whitehall, London, SW1A 2HB",
  
  // Birmingham areas
  "Bull Ring, Birmingham, B5 4BU",
  "Corporation Street, Birmingham, B2 4LP",
  "New Street, Birmingham, B2 4QA",
  "Broad Street, Birmingham, B1 2EA",
  "Colmore Row, Birmingham, B3 2QA",
  
  // Manchester areas
  "Deansgate, Manchester, M3 2EN",
  "Market Street, Manchester, M1 1PT",
  "Oldham Street, Manchester, M1 1JQ",
  "Portland Street, Manchester, M1 3LA",
  "Spring Gardens, Manchester, M2 1FB",
  
  // Leeds areas
  "Briggate, Leeds, LS1 6HD",
  "The Headrow, Leeds, LS1 8TL",
  "Boar Lane, Leeds, LS1 5DA",
  "Wellington Street, Leeds, LS1 2DE",
  
  // Liverpool areas
  "Mathew Street, Liverpool, L2 6RE",
  "Lord Street, Liverpool, L2 1RJ",
  "Castle Street, Liverpool, L2 3SX",
  "Dale Street, Liverpool, L2 2EZ",
  
  // Sheffield areas
  "Division Street, Sheffield, S1 4GF",
  "West Street, Sheffield, S1 4EZ",
  "Pinstone Street, Sheffield, S1 2HN",
  "Howard Street, Sheffield, S1 1LX",
  
  // Bristol areas
  "Cabot Circus, Bristol, BS1 3BX",
  "Broadmead, Bristol, BS1 3HZ",
  "Queen Street, Bristol, BS1 4LN",
  "Wine Street, Bristol, BS1 2AG",
  
  // Newcastle areas
  "Collingwood Street, Newcastle, NE1 1JF",
  "Clayton Street, Newcastle, NE1 5PN",
  "Pilgrim Street, Newcastle, NE1 6QG",
  "Dean Street, Newcastle, NE1 1PG",
  
  // Scotland - Glasgow
  "Sauchiehall Street, Glasgow, G2 3AD",
  "Argyle Street, Glasgow, G2 8BG",
  "Merchant City, Glasgow, G1 1RE",
  "West End, Glasgow, G12 8QQ",
  
  // Scotland - Edinburgh
  "Princes Street, Edinburgh, EH2 2BY",
  "George Street, Edinburgh, EH2 2LR",
  "Rose Street, Edinburgh, EH2 2NG",
  "Grassmarket, Edinburgh, EH1 2HJ",
  
  // Wales - Cardiff
  "St Mary Street, Cardiff, CF10 1FA",
  "The Hayes, Cardiff, CF10 1AH",
  "Mill Lane, Cardiff, CF10 1FL",
  "Castle Street, Cardiff, CF10 1BU",
  
  // Northern England
  "Shambles, York, YO1 7LZ",
  "Stonegate, York, YO1 8AS",
  "Parliament Street, York, YO1 8RS",
  "Market Place, Durham, DH1 3NJ",
  "Elvet Bridge, Durham, DH1 3AG",
  
  // South West England
  "Union Street, Plymouth, PL1 3EZ",
  "Royal Parade, Plymouth, PL1 2TR",
  "Torquay Road, Paignton, TQ3 3AF",
  "Exeter High Street, Exeter, EX4 3LF",
  
  // East England
  "Market Hill, Cambridge, CB2 3NJ",
  "King's Parade, Cambridge, CB2 1SJ",
  "Trinity Street, Cambridge, CB2 1TQ",
  "Norwich Market, Norwich, NR2 1ND",
  "Gentleman's Walk, Norwich, NR2 1NA",
  
  // Midlands
  "Corporation Street, Coventry, CV1 1GF",
  "Hertford Street, Coventry, CV1 1LB",
  "Market Square, Nottingham, NG1 2DP",
  "Long Row, Nottingham, NG1 2DH",
  "Lace Market, Nottingham, NG1 1LA",
  
  // South England
  "Above Bar Street, Southampton, SO14 7DX",
  "West Quay, Southampton, SO15 1QD",
  "Commercial Road, Portsmouth, PO1 4BZ",
  "Gunwharf Quays, Portsmouth, PO1 3TZ",
  "Churchill Square, Brighton, BN1 2RG",
  "North Laine, Brighton, BN1 1HG",
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
    
    // Check for word boundary matches for better relevance
    const wordBoundaryMatch = queryWords.every(word => 
      new RegExp(`\\b${word}`, 'i').test(address)
    );
    
    // Check for street type matches (e.g., "lane" matches "Hempsted Lane")
    const streetTypeMatch = COMMON_STREET_TYPES.some(type => 
      searchTerm.includes(type.toLowerCase()) && addressLower.includes(type.toLowerCase())
    );
    
    // ENHANCED: Check for phonetic matches on individual words
    const phoneticMatch = queryWords.some(queryWord => {
      const streetWords = streetName.split(/\s+/);
      return streetWords.some(streetWord => {
        return getWordPhoneticSimilarity(queryWord, streetWord) >= 80;
      });
    });
    
    // ENHANCED: Check for partial word matches (e.g., "hallow" should match "hollow")
    const partialPhoneticMatch = queryWords.some(queryWord => {
      if (queryWord.length >= 3) { // Only for words 3+ chars
        return streetName.split(/\s+/).some(streetWord => {
          // Check if it's a close phonetic match
          const similarity = getWordPhoneticSimilarity(queryWord, streetWord);
          return similarity >= 70; // Lower threshold for single words
        });
      }
      return false;
    });
    
    return allWordsMatch || streetMatch || wordBoundaryMatch || streetTypeMatch || phoneticMatch || partialPhoneticMatch;
  });

  // Smart relevance scoring with phonetic matching
  matches.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    const aStreet = aLower.split(',')[0].trim();
    const bStreet = bLower.split(',')[0].trim();
    
    // 1. Exact match gets highest priority
    if (aLower === searchTerm && bLower !== searchTerm) return -1;
    if (aLower !== searchTerm && bLower === searchTerm) return 1;
    
    // 2. Exact street name match (before comma)
    if (aStreet === searchTerm && bStreet !== searchTerm) return -1;
    if (aStreet !== searchTerm && bStreet === searchTerm) return 1;
    
    // 3. Phonetic similarity (hallow ≈ hollow)
    const aPhonetic = calculatePhoneticSimilarity(searchTerm, aStreet);
    const bPhonetic = calculatePhoneticSimilarity(searchTerm, bStreet);
    if (aPhonetic > bPhonetic) return -1;
    if (aPhonetic < bPhonetic) return 1;
    
    // 4. Starts with match
    if (aStreet.startsWith(searchTerm) && !bStreet.startsWith(searchTerm)) return -1;
    if (!aStreet.startsWith(searchTerm) && bStreet.startsWith(searchTerm)) return 1;
    
    // 5. Word boundary matches
    const aWordMatch = queryWords.every(word => 
      new RegExp(`\\b${word}`, 'i').test(aStreet)
    );
    const bWordMatch = queryWords.every(word => 
      new RegExp(`\\b${word}`, 'i').test(bStreet)
    );
    if (aWordMatch && !bWordMatch) return -1;
    if (!aWordMatch && bWordMatch) return 1;
    
    // 6. Length similarity (shorter is more relevant)
    const aLength = Math.abs(aStreet.length - searchTerm.length);
    const bLength = Math.abs(bStreet.length - searchTerm.length);
    if (aLength < bLength) return -1;
    if (aLength > bLength) return 1;
    
    return a.localeCompare(b);
  });

  // ENHANCED: For city/area names, suggest street types and area options first
  if (matches.length > 0) {
    const cityAreaMatches = ['london', 'manchester', 'birmingham', 'liverpool', 'leeds', 'glasgow', 'edinburgh', 'bristol', 'cardiff', 'belfast'];
    const isLikeCityQuery = cityAreaMatches.some(city => searchTerm.toLowerCase().includes(city.toLowerCase()));
    
    if (isLikeCityQuery && queryWords.length === 1) {
      // For single city names, prioritize street type suggestions
      const cityName = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
      const streetTypeSuggestions = [
        `${cityName} Road - Enter Full Address`,
        `${cityName} Street - Enter Full Address`, 
        `${cityName} Lane - Enter Full Address`,
        `${cityName} Avenue - Enter Full Address`,
        `${cityName} Close - Enter Full Address`,
        `${cityName} Business Park - Enter Full Address`,
        `${cityName} Industrial Estate - Enter Full Address`
      ];
      
      // Combine street type suggestions with a few best existing matches
      return [...streetTypeSuggestions.slice(0, 5), ...matches.slice(0, 3)].slice(0, limit);
    }
  }

  // If no matches found, provide intelligent fallback suggestions
  if (matches.length === 0) {
    // Check if query contains business/unit patterns
    if (searchTerm.includes('unit') || searchTerm.includes('suite') || searchTerm.match(/\d+[a-z]/)) {
      fallbackSuggestions = [
        "Business Park, Birmingham, B1 1AA",
        "Industrial Estate, Manchester, M1 1AA", 
        "Business Centre, London, EC1A 1BB",
        "Trade Park, Leeds, LS1 1AA",
        "Commercial Unit, Liverpool, L1 1AA"
      ];
    }
    // Check if query looks like a postcode area
    else if (searchTerm.match(/^[a-z]{1,2}\d/)) {
      fallbackSuggestions = [
        "High Street, " + searchTerm.toUpperCase() + " Area",
        "Main Road, " + searchTerm.toUpperCase() + " District", 
        "Station Road, " + searchTerm.toUpperCase() + " Region"
      ];
    }
    // Check for common street patterns
    else if (queryWords.some(word => COMMON_STREET_TYPES.includes(word.charAt(0).toUpperCase() + word.slice(1)))) {
      fallbackSuggestions = [
        "High Street, Birmingham, B1 1AA",
        "Victoria Street, Manchester, M1 1AA",
        "Church Street, London, EC1A 1BB",
        "Station Road, Leeds, LS1 1AA",
        "Queen Street, Liverpool, L1 1AA"
      ];
    }
    // For other unrecognized queries, suggest creating new folder
    else if (searchTerm.length >= 3) {
      fallbackSuggestions = [
        `${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)} - Create New Location`,
        "Business Address - Enter Manually",
        "Residential Address - Enter Manually",
        "Project Location - Enter Manually"
      ];
    }
    
    return fallbackSuggestions.slice(0, limit);
  }

  return matches.slice(0, limit);
}

// Smart phonetic similarity calculation
function calculatePhoneticSimilarity(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  
  // Exact match
  if (q === t) return 100;
  
  // Handle multi-word queries like "hallow road"
  const queryWords = q.split(/\s+/);
  const targetWords = t.split(/\s+/);
  
  // If both are multi-word, check word-by-word phonetic matching
  if (queryWords.length > 1 && targetWords.length > 1) {
    let totalSimilarity = 0;
    let matchCount = 0;
    
    for (let i = 0; i < Math.max(queryWords.length, targetWords.length); i++) {
      const qWord = queryWords[i] || '';
      const tWord = targetWords[i] || '';
      
      if (qWord && tWord) {
        totalSimilarity += getWordPhoneticSimilarity(qWord, tWord);
        matchCount++;
      }
    }
    
    return matchCount > 0 ? totalSimilarity / matchCount : 0;
  }
  
  // Single word comparison
  return getWordPhoneticSimilarity(q, t);
}

function getWordPhoneticSimilarity(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  
  // Handle common phonetic patterns
  const phoneticMap: Record<string, string[]> = {
    'hallow': ['hollow'],
    'hollow': ['hallow'], 
    'road': ['rd'],
    'street': ['st'],
    'lane': ['ln'],
    'avenue': ['ave'],
    'close': ['cl'],
    'court': ['ct']
  };
  
  // Check if query maps to target phonetically
  if (phoneticMap[q]?.includes(t) || phoneticMap[t]?.includes(q)) {
    return 95;
  }
  
  // Check for partial phonetic matches
  for (const [key, variants] of Object.entries(phoneticMap)) {
    if (q.includes(key) && variants.some(v => t.includes(v))) {
      return 90;
    }
  }
  
  // Enhanced: Check for similar-sounding words (1-2 character differences)
  if (Math.abs(q.length - t.length) <= 2) {
    const distance = levenshteinDistance(q, t);
    if (distance <= 2) {
      return 85 - (distance * 10); // 85, 75, 65 for 1, 2, 3 char diff
    }
  }
  
  // Enhanced: Check for common sound patterns
  const soundPatterns: Array<[string, string]> = [
    ['hallow', 'hollow'],
    ['halo', 'hollow'],
    ['hall', 'hollow'],
    ['hol', 'hollow']
  ];
  
  for (const [pattern, target_pattern] of soundPatterns) {
    if (q.startsWith(pattern) && t.startsWith(target_pattern)) {
      return 80;
    }
    if (t.startsWith(pattern) && q.startsWith(target_pattern)) {
      return 80;
    }
  }
  
  // Levenshtein distance similarity
  const distance = levenshteinDistance(q, t);
  const maxLength = Math.max(q.length, t.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  return Math.max(0, similarity);
}

// Calculate edit distance between two strings
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}