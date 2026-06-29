export interface Port {
  id: string;
  name: string;
  city: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: 'hub' | 'canal' | 'checkpoint';
  description: string;
  annualTrafficTEU: string;
}

export const ports: Port[] = [
  // --- ASIA ---
  { id: 'mumbai', name: 'Mumbai JNPT', city: 'Mumbai', country: 'India', coordinates: { lat: 18.95, lng: 72.82 }, type: 'hub', description: 'Largest container port in India.', annualTrafficTEU: '6.2 Million' },
  { id: 'chennai', name: 'Port of Chennai', city: 'Chennai', country: 'India', coordinates: { lat: 13.09, lng: 80.30 }, type: 'hub', description: 'Major port on the Bay of Bengal.', annualTrafficTEU: '1.5 Million' },
  { id: 'kolkata', name: 'Port of Kolkata', city: 'Kolkata', country: 'India', coordinates: { lat: 22.48, lng: 88.31 }, type: 'hub', description: 'Riverine port serving East India.', annualTrafficTEU: '0.8 Million' },
  { id: 'vizag', name: 'Visakhapatnam Port', city: 'Visakhapatnam', country: 'India', coordinates: { lat: 17.69, lng: 83.29 }, type: 'hub', description: 'Key industrial port on India\'s east coast.', annualTrafficTEU: '0.6 Million' },
  { id: 'cochin', name: 'Cochin Port', city: 'Kochi', country: 'India', coordinates: { lat: 9.97, lng: 76.27 }, type: 'hub', description: 'Natural harbor facing the Arabian Sea.', annualTrafficTEU: '0.7 Million' },
  { id: 'mundra', name: 'Mundra Port', city: 'Mundra', country: 'India', coordinates: { lat: 22.74, lng: 69.70 }, type: 'hub', description: 'Largest private port in India.', annualTrafficTEU: '7.2 Million' },
  
  { id: 'singapore', name: 'Port of Singapore', city: 'Singapore', country: 'Singapore', coordinates: { lat: 1.28, lng: 103.83 }, type: 'hub', description: 'Global transshipment powerhouse.', annualTrafficTEU: '37.3 Million' },
  
  { id: 'shanghai', name: 'Port of Shanghai', city: 'Shanghai', country: 'China', coordinates: { lat: 31.23, lng: 121.50 }, type: 'hub', description: 'Busiest container port in the world.', annualTrafficTEU: '47.3 Million' },
  { id: 'ningbo', name: 'Ningbo-Zhoushan Port', city: 'Ningbo', country: 'China', coordinates: { lat: 29.87, lng: 121.64 }, type: 'hub', description: 'Deepwater port in Zhejiang province.', annualTrafficTEU: '33.3 Million' },
  { id: 'shenzhen', name: 'Port of Shenzhen', city: 'Shenzhen', country: 'China', coordinates: { lat: 22.50, lng: 113.91 }, type: 'hub', description: 'Major southern China trade gateway.', annualTrafficTEU: '30.0 Million' },
  { id: 'guangzhou', name: 'Port of Guangzhou', city: 'Guangzhou', country: 'China', coordinates: { lat: 23.10, lng: 113.43 }, type: 'hub', description: 'Key port in the Pearl River Delta.', annualTrafficTEU: '24.4 Million' },
  { id: 'qingdao', name: 'Port of Qingdao', city: 'Qingdao', country: 'China', coordinates: { lat: 36.09, lng: 120.32 }, type: 'hub', description: 'Busiest port in Northern China.', annualTrafficTEU: '25.6 Million' },
  { id: 'tianjin', name: 'Port of Tianjin', city: 'Tianjin', country: 'China', coordinates: { lat: 38.98, lng: 117.78 }, type: 'hub', description: 'Maritime gateway to Beijing.', annualTrafficTEU: '21.0 Million' },
  { id: 'xiamen', name: 'Port of Xiamen', city: 'Xiamen', country: 'China', coordinates: { lat: 24.46, lng: 118.06 }, type: 'hub', description: 'Deepwater port on Fujian coast.', annualTrafficTEU: '12.0 Million' },
  { id: 'dalian', name: 'Port of Dalian', city: 'Dalian', country: 'China', coordinates: { lat: 38.93, lng: 121.65 }, type: 'hub', description: 'Northernmost ice-free port in China.', annualTrafficTEU: '6.5 Million' },
  { id: 'hong_kong', name: 'Port of Hong Kong', city: 'Hong Kong', country: 'China', coordinates: { lat: 22.30, lng: 114.15 }, type: 'hub', description: 'Major transshipment hub of southern China.', annualTrafficTEU: '16.6 Million' },
  { id: 'kaohsiung', name: 'Port of Kaohsiung', city: 'Kaohsiung', country: 'Taiwan', coordinates: { lat: 22.61, lng: 120.28 }, type: 'hub', description: 'Largest port in Taiwan.', annualTrafficTEU: '9.5 Million' },
  
  { id: 'tokyo', name: 'Port of Tokyo', city: 'Tokyo', country: 'Japan', coordinates: { lat: 35.62, lng: 139.77 }, type: 'hub', description: 'Major consumer gateway of Japan.', annualTrafficTEU: '4.8 Million' },
  { id: 'yokohama', name: 'Port of Yokohama', city: 'Yokohama', country: 'Japan', coordinates: { lat: 35.44, lng: 139.68 }, type: 'hub', description: 'Historic trade gateway on Tokyo Bay.', annualTrafficTEU: '2.8 Million' },
  { id: 'nagoya', name: 'Port of Nagoya', city: 'Nagoya', country: 'Japan', coordinates: { lat: 35.05, lng: 136.85 }, type: 'hub', description: 'Automobile export hub of Japan.', annualTrafficTEU: '2.5 Million' },
  { id: 'osaka', name: 'Port of Osaka', city: 'Osaka', country: 'Japan', coordinates: { lat: 34.64, lng: 135.42 }, type: 'hub', description: 'Key hub for the Kansai region.', annualTrafficTEU: '2.1 Million' },
  { id: 'kobe', name: 'Port of Kobe', city: 'Kobe', country: 'Japan', coordinates: { lat: 34.67, lng: 135.22 }, type: 'hub', description: 'Deepwater port in Osaka Bay.', annualTrafficTEU: '2.0 Million' },
  { id: 'fukuoka', name: 'Port of Hakata', city: 'Fukuoka', country: 'Japan', coordinates: { lat: 33.60, lng: 130.40 }, type: 'hub', description: 'Closest Japanese port to mainland Asia.', annualTrafficTEU: '1.0 Million' },
  
  { id: 'busan', name: 'Port of Busan', city: 'Busan', country: 'South Korea', coordinates: { lat: 35.10, lng: 129.04 }, type: 'hub', description: 'Largest transshipment hub in Northeast Asia.', annualTrafficTEU: '22.0 Million' },
  { id: 'incheon', name: 'Port of Incheon', city: 'Incheon', country: 'South Korea', coordinates: { lat: 37.45, lng: 126.59 }, type: 'hub', description: 'Gateway port to Seoul.', annualTrafficTEU: '3.2 Million' },
  { id: 'gwangyang', name: 'Port of Gwangyang', city: 'Gwangyang', country: 'South Korea', coordinates: { lat: 34.90, lng: 127.70 }, type: 'hub', description: 'Industrial container hub in southern Korea.', annualTrafficTEU: '2.2 Million' },
  
  { id: 'port_klang', name: 'Port Klang', city: 'Port Klang', country: 'Malaysia', coordinates: { lat: 3.00, lng: 101.36 }, type: 'hub', description: 'Busiest port in Malaysia.', annualTrafficTEU: '13.7 Million' },
  { id: 'tanjung_pelepas', name: 'Port of Tanjung Pelepas', city: 'Johor', country: 'Malaysia', coordinates: { lat: 1.37, lng: 103.54 }, type: 'hub', description: 'Major transshipment hub next to Singapore.', annualTrafficTEU: '11.0 Million' },
  { id: 'penang', name: 'Port of Penang', city: 'Penang', country: 'Malaysia', coordinates: { lat: 5.41, lng: 100.34 }, type: 'hub', description: 'Serving northern Malaysian trade.', annualTrafficTEU: '1.4 Million' },
  
  { id: 'laem_chabang', name: 'Laem Chabang Port', city: 'Chonburi', country: 'Thailand', coordinates: { lat: 13.08, lng: 100.89 }, type: 'hub', description: 'Primary deepwater port of Thailand.', annualTrafficTEU: '8.4 Million' },
  { id: 'bangkok', name: 'Port of Bangkok', city: 'Bangkok', country: 'Thailand', coordinates: { lat: 13.70, lng: 100.58 }, type: 'hub', description: 'River port serving the capital region.', annualTrafficTEU: '1.4 Million' },
  { id: 'manila', name: 'Port of Manila', city: 'Manila', country: 'Philippines', coordinates: { lat: 14.60, lng: 120.95 }, type: 'hub', description: 'Principal shipping gateway of the Philippines.', annualTrafficTEU: '5.0 Million' },
  
  { id: 'jakarta', name: 'Tanjung Priok', city: 'Jakarta', country: 'Indonesia', coordinates: { lat: -6.10, lng: 106.88 }, type: 'hub', description: 'Largest and busiest port in Indonesia.', annualTrafficTEU: '7.8 Million' },
  { id: 'surabaya', name: 'Tanjung Perak', city: 'Surabaya', country: 'Indonesia', coordinates: { lat: -7.20, lng: 112.73 }, type: 'hub', description: 'Primary trade link for Eastern Indonesia.', annualTrafficTEU: '3.9 Million' },
  { id: 'belawan', name: 'Port of Belawan', city: 'Medan', country: 'Indonesia', coordinates: { lat: 3.78, lng: 98.69 }, type: 'hub', description: 'Major port in Sumatra.', annualTrafficTEU: '1.2 Million' },
  
  { id: 'ho_chi_minh', name: 'Saigon Port', city: 'Ho Chi Minh', country: 'Vietnam', coordinates: { lat: 10.77, lng: 106.75 }, type: 'hub', description: 'Busiest port system in southern Vietnam.', annualTrafficTEU: '8.1 Million' },
  { id: 'hai_phong', name: 'Port of Hai Phong', city: 'Hai Phong', country: 'Vietnam', coordinates: { lat: 20.87, lng: 106.70 }, type: 'hub', description: 'Principal port for Northern Vietnam.', annualTrafficTEU: '5.6 Million' },
  { id: 'da_nang', name: 'Port of Da Nang', city: 'Da Nang', country: 'Vietnam', coordinates: { lat: 16.08, lng: 108.22 }, type: 'hub', description: 'Gateway to central Vietnam.', annualTrafficTEU: '1.0 Million' },
  
  { id: 'colombo', name: 'Port of Colombo', city: 'Colombo', country: 'Sri Lanka', coordinates: { lat: 6.94, lng: 79.84 }, type: 'hub', description: 'Strategic transshipment hub in South Asia.', annualTrafficTEU: '7.3 Million' },
  { id: 'karachi', name: 'Port of Karachi', city: 'Karachi', country: 'Pakistan', coordinates: { lat: 24.80, lng: 66.97 }, type: 'hub', description: 'Busiest port in Pakistan.', annualTrafficTEU: '2.1 Million' },
  { id: 'chittagong', name: 'Port of Chittagong', city: 'Chittagong', country: 'Bangladesh', coordinates: { lat: 22.23, lng: 91.80 }, type: 'hub', description: 'Busiest port on the Bay of Bengal.', annualTrafficTEU: '3.0 Million' },

  // --- MIDDLE EAST ---
  { id: 'dubai', name: 'Jebel Ali Port', city: 'Dubai', country: 'UAE', coordinates: { lat: 25.01, lng: 55.06 }, type: 'hub', description: 'Largest marine terminal in the Middle East.', annualTrafficTEU: '13.7 Million' },
  { id: 'abu_dhabi', name: 'Khalifa Port', city: 'Abu Dhabi', country: 'UAE', coordinates: { lat: 24.51, lng: 54.39 }, type: 'hub', description: 'Deepwater gateway of Abu Dhabi.', annualTrafficTEU: '3.2 Million' },
  { id: 'sharjah', name: 'Khalid Port', city: 'Sharjah', country: 'UAE', coordinates: { lat: 25.37, lng: 55.37 }, type: 'hub', description: 'Serving industrial zones of Sharjah.', annualTrafficTEU: '0.8 Million' },
  { id: 'jeddah', name: 'Jeddah Islamic Port', city: 'Jeddah', country: 'Saudi Arabia', coordinates: { lat: 21.48, lng: 39.16 }, type: 'hub', description: 'Primary Red Sea port of Saudi Arabia.', annualTrafficTEU: '4.8 Million' },
  { id: 'dammam', name: 'King Abdulaziz Port', city: 'Dammam', country: 'Saudi Arabia', coordinates: { lat: 26.43, lng: 50.21 }, type: 'hub', description: 'Primary Arabian Gulf port for Saudi Arabia.', annualTrafficTEU: '2.3 Million' },
  { id: 'doha', name: 'Hamad Port', city: 'Doha', country: 'Qatar', coordinates: { lat: 25.01, lng: 51.61 }, type: 'hub', description: 'State-of-the-art container hub.', annualTrafficTEU: '1.4 Million' },
  { id: 'salalah', name: 'Port of Salalah', city: 'Salalah', country: 'Oman', coordinates: { lat: 16.94, lng: 54.00 }, type: 'hub', description: 'Major transshipment hub on the Indian Ocean.', annualTrafficTEU: '4.3 Million' },
  { id: 'sohar', name: 'Sohar Port', city: 'Sohar', country: 'Oman', coordinates: { lat: 24.40, lng: 56.63 }, type: 'hub', description: 'Industrial gateway on the Gulf of Oman.', annualTrafficTEU: '0.7 Million' },
  { id: 'kuwait', name: 'Shuwaikh Port', city: 'Kuwait City', country: 'Kuwait', coordinates: { lat: 29.35, lng: 47.93 }, type: 'hub', description: 'Kuwait\'s primary commercial port.', annualTrafficTEU: '0.9 Million' },
  { id: 'manama', name: 'Khalifa Bin Salman Port', city: 'Manama', country: 'Bahrain', coordinates: { lat: 26.21, lng: 50.68 }, type: 'hub', description: 'Bahrain\'s premier logistics gateway.', annualTrafficTEU: '0.4 Million' },
  { id: 'aqaba', name: 'Port of Aqaba', city: 'Aqaba', country: 'Jordan', coordinates: { lat: 29.51, lng: 35.00 }, type: 'hub', description: 'Jordan\'s sole maritime outlet.', annualTrafficTEU: '0.8 Million' },

  // --- EUROPE ---
  { id: 'rotterdam', name: 'Port of Rotterdam', city: 'Rotterdam', country: 'Netherlands', coordinates: { lat: 51.95, lng: 4.02 }, type: 'hub', description: 'Gateway to Europe.', annualTrafficTEU: '14.5 Million' },
  { id: 'hamburg', name: 'Port of Hamburg', city: 'Hamburg', country: 'Germany', coordinates: { lat: 53.54, lng: 9.94 }, type: 'hub', description: 'Third busiest port in Europe.', annualTrafficTEU: '8.7 Million' },
  { id: 'bremen', name: 'Bremen-Bremerhaven Port', city: 'Bremerhaven', country: 'Germany', coordinates: { lat: 53.56, lng: 8.56 }, type: 'hub', description: 'Major German automobile port.', annualTrafficTEU: '4.8 Million' },
  { id: 'antwerp', name: 'Port of Antwerp-Bruges', city: 'Antwerp', country: 'Belgium', coordinates: { lat: 51.24, lng: 4.34 }, type: 'hub', description: 'Europe\'s second largest container port.', annualTrafficTEU: '13.5 Million' },
  { id: 'valencia', name: 'Port of Valencia', city: 'Valencia', country: 'Spain', coordinates: { lat: 39.44, lng: -0.32 }, type: 'hub', description: 'Busiest port in Spain.', annualTrafficTEU: '5.1 Million' },
  { id: 'algeciras', name: 'Port of Algeciras', city: 'Algeciras', country: 'Spain', coordinates: { lat: 36.13, lng: -5.44 }, type: 'hub', description: 'Transshipment hub facing Gibraltar.', annualTrafficTEU: '4.7 Million' },
  { id: 'barcelona', name: 'Port of Barcelona', city: 'Barcelona', country: 'Spain', coordinates: { lat: 41.34, lng: 2.16 }, type: 'hub', description: 'Catalonia\'s industrial gateway.', annualTrafficTEU: '3.5 Million' },
  { id: 'athens', name: 'Port of Piraeus', city: 'Athens', country: 'Greece', coordinates: { lat: 37.93, lng: 23.63 }, type: 'hub', description: 'Principal Mediterranean port.', annualTrafficTEU: '5.6 Million' },
  { id: 'genoa', name: 'Port of Genoa', city: 'Genoa', country: 'Italy', coordinates: { lat: 44.40, lng: 8.90 }, type: 'hub', description: 'Northern Italy\'s primary trade link.', annualTrafficTEU: '2.5 Million' },
  { id: 'trieste', name: 'Port of Trieste', city: 'Trieste', country: 'Italy', coordinates: { lat: 45.65, lng: 13.76 }, type: 'hub', description: 'Key Adriatic port connecting central Europe.', annualTrafficTEU: '0.8 Million' },
  { id: 'le_havre', name: 'HAROPA Port Le Havre', city: 'Le Havre', country: 'France', coordinates: { lat: 49.48, lng: 0.12 }, type: 'hub', description: 'Leading French container port.', annualTrafficTEU: '3.1 Million' },
  { id: 'marseille', name: 'Port of Marseille Fos', city: 'Marseille', country: 'France', coordinates: { lat: 43.34, lng: 4.83 }, type: 'hub', description: 'French Mediterranean hub.', annualTrafficTEU: '1.2 Million' },
  { id: 'felixstowe', name: 'Port of Felixstowe', city: 'Felixstowe', country: 'UK', coordinates: { lat: 51.95, lng: 1.30 }, type: 'hub', description: 'UK\'s busiest container port.', annualTrafficTEU: '3.8 Million' },
  { id: 'southampton', name: 'Port of Southampton', city: 'Southampton', country: 'UK', coordinates: { lat: 50.90, lng: -1.40 }, type: 'hub', description: 'Key UK container and cruise gateway.', annualTrafficTEU: '1.9 Million' },
  { id: 'london', name: 'London Gateway', city: 'London', country: 'UK', coordinates: { lat: 51.51, lng: 0.46 }, type: 'hub', description: 'Deepwater logistics hub on the Thames.', annualTrafficTEU: '1.8 Million' },
  { id: 'gdansk', name: 'Port of Gdansk', city: 'Gdansk', country: 'Poland', coordinates: { lat: 54.40, lng: 18.66 }, type: 'hub', description: 'Fastest growing Baltic gateway.', annualTrafficTEU: '2.2 Million' },
  { id: 'gothenburg', name: 'Port of Gothenburg', city: 'Gothenburg', country: 'Sweden', coordinates: { lat: 57.69, lng: 11.83 }, type: 'hub', description: 'Largest port in Scandinavia.', annualTrafficTEU: '0.9 Million' },
  { id: 'st_petersburg', name: 'Port of St. Petersburg', city: 'St. Petersburg', country: 'Russia', coordinates: { lat: 59.93, lng: 30.25 }, type: 'hub', description: 'Russia\'s primary Baltic gateway.', annualTrafficTEU: '1.8 Million' },
  { id: 'istanbul', name: 'Port of Ambarli', city: 'Istanbul', country: 'Turkey', coordinates: { lat: 40.97, lng: 28.69 }, type: 'hub', description: 'Largest container port in Turkey.', annualTrafficTEU: '3.2 Million' },

  // --- AFRICA ---
  { id: 'cape_town', name: 'Port of Cape Town', city: 'Cape Town', country: 'South Africa', coordinates: { lat: -33.91, lng: 18.44 }, type: 'hub', description: 'Strategic bypass and local hub.', annualTrafficTEU: '0.9 Million' },
  { id: 'durban', name: 'Port of Durban', city: 'Durban', country: 'South Africa', coordinates: { lat: -29.87, lng: 31.02 }, type: 'hub', description: 'Busiest container port in Sub-Saharan Africa.', annualTrafficTEU: '2.7 Million' },
  { id: 'port_elizabeth', name: 'Port Elizabeth Port', city: 'Port Elizabeth', country: 'South Africa', coordinates: { lat: -33.96, lng: 25.63 }, type: 'hub', description: 'Southeastern South Africa terminal.', annualTrafficTEU: '0.5 Million' },
  { id: 'mombasa', name: 'Port of Mombasa', city: 'Mombasa', country: 'Kenya', coordinates: { lat: -4.04, lng: 39.66 }, type: 'hub', description: 'Principal gateway to East Africa.', annualTrafficTEU: '1.4 Million' },
  { id: 'dar_es_salaam', name: 'Port of Dar es Salaam', city: 'Dar es Salaam', country: 'Tanzania', coordinates: { lat: -6.82, lng: 39.30 }, type: 'hub', description: 'Major trade link for East-Central Africa.', annualTrafficTEU: '0.8 Million' },
  { id: 'djibouti', name: 'Port of Djibouti', city: 'Djibouti', country: 'Djibouti', coordinates: { lat: 11.60, lng: 43.14 }, type: 'hub', description: 'Strategic gateway to Horn of Africa.', annualTrafficTEU: '1.0 Million' },
  { id: 'lagos', name: 'Apapa Port', city: 'Lagos', country: 'Nigeria', coordinates: { lat: 6.43, lng: 3.36 }, type: 'hub', description: 'Busiest port in Nigeria.', annualTrafficTEU: '1.2 Million' },
  { id: 'alexandria', name: 'Port of Alexandria', city: 'Alexandria', country: 'Egypt', coordinates: { lat: 31.20, lng: 29.87 }, type: 'hub', description: 'Main Mediterranean gateway of Egypt.', annualTrafficTEU: '1.6 Million' },
  { id: 'casablanca', name: 'Port of Casablanca', city: 'Casablanca', country: 'Morocco', coordinates: { lat: 33.61, lng: -7.60 }, type: 'hub', description: 'Commercial heart of Morocco.', annualTrafficTEU: '1.1 Million' },
  { id: 'tangier', name: 'Tanger Med Port', city: 'Tangier', country: 'Morocco', coordinates: { lat: 35.88, lng: -5.50 }, type: 'hub', description: 'Massive transshipment hub on Strait of Gibraltar.', annualTrafficTEU: '7.5 Million' },
  { id: 'abidjan', name: 'Port of Abidjan', city: 'Abidjan', country: 'Ivory Coast', coordinates: { lat: 5.28, lng: -4.03 }, type: 'hub', description: 'West African economic engine.', annualTrafficTEU: '0.9 Million' },
  { id: 'dakar', name: 'Port of Dakar', city: 'Dakar', country: 'Senegal', coordinates: { lat: 14.68, lng: -17.43 }, type: 'hub', description: 'Westernmost port on African continent.', annualTrafficTEU: '0.7 Million' },

  // --- NORTH AMERICA ---
  { id: 'los_angeles', name: 'Port of Los Angeles', city: 'Los Angeles', country: 'USA', coordinates: { lat: 33.74, lng: -118.26 }, type: 'hub', description: 'Busiest port in North America.', annualTrafficTEU: '10.6 Million' },
  { id: 'long_beach', name: 'Port of Long Beach', city: 'Long Beach', country: 'USA', coordinates: { lat: 33.75, lng: -118.21 }, type: 'hub', description: 'Major US-Asia container gateway.', annualTrafficTEU: '9.3 Million' },
  { id: 'oakland', name: 'Port of Oakland', city: 'Oakland', country: 'USA', coordinates: { lat: 37.80, lng: -122.31 }, type: 'hub', description: 'Principal Northern California container hub.', annualTrafficTEU: '2.4 Million' },
  { id: 'seattle', name: 'Port of Seattle', city: 'Seattle', country: 'USA', coordinates: { lat: 47.60, lng: -122.34 }, type: 'hub', description: 'Pacific Northwest trade hub.', annualTrafficTEU: '1.7 Million' },
  { id: 'new_york', name: 'Port of NY and NJ', city: 'New York', country: 'USA', coordinates: { lat: 40.67, lng: -74.12 }, type: 'hub', description: 'Busiest port on the US East Coast.', annualTrafficTEU: '8.9 Million' },
  { id: 'savannah', name: 'Port of Savannah', city: 'Savannah', country: 'USA', coordinates: { lat: 32.12, lng: -81.13 }, type: 'hub', description: 'Rapidly growing East Coast logistics center.', annualTrafficTEU: '5.6 Million' },
  { id: 'norfolk', name: 'Port of Virginia', city: 'Norfolk', country: 'USA', coordinates: { lat: 36.85, lng: -76.30 }, type: 'hub', description: 'Deepwater container terminal in Mid-Atlantic.', annualTrafficTEU: '3.5 Million' },
  { id: 'houston', name: 'Port of Houston', city: 'Houston', country: 'USA', coordinates: { lat: 29.75, lng: -95.07 }, type: 'hub', description: 'Leading Gulf Coast industrial gateway.', annualTrafficTEU: '3.9 Million' },
  { id: 'vancouver', name: 'Port of Vancouver', city: 'Vancouver', country: 'Canada', coordinates: { lat: 49.30, lng: -123.10 }, type: 'hub', description: 'Canada\'s largest port.', annualTrafficTEU: '3.8 Million' },
  { id: 'montreal', name: 'Port of Montreal', city: 'Montreal', country: 'Canada', coordinates: { lat: 45.50, lng: -73.54 }, type: 'hub', description: 'Major St. Lawrence River inland port.', annualTrafficTEU: '1.7 Million' },
  { id: 'halifax', name: 'Port of Halifax', city: 'Halifax', country: 'Canada', coordinates: { lat: 44.65, lng: -63.57 }, type: 'hub', description: 'East Coast deepwater harbor.', annualTrafficTEU: '0.6 Million' },
  { id: 'manzanillo_mx', name: 'Port of Manzanillo', city: 'Manzanillo', country: 'Mexico', coordinates: { lat: 19.05, lng: -104.32 }, type: 'hub', description: 'Mexico\'s busiest Pacific port.', annualTrafficTEU: '3.4 Million' },
  { id: 'veracruz', name: 'Port of Veracruz', city: 'Veracruz', country: 'Mexico', coordinates: { lat: 19.20, lng: -96.13 }, type: 'hub', description: 'Historic Gulf Coast gateway.', annualTrafficTEU: '1.1 Million' },

  // --- SOUTH AMERICA ---
  { id: 'santos', name: 'Port of Santos', city: 'Santos', country: 'Brazil', coordinates: { lat: -23.95, lng: -46.30 }, type: 'hub', description: 'Largest port in South America.', annualTrafficTEU: '4.8 Million' },
  { id: 'rio_janeiro', name: 'Port of Rio de Janeiro', city: 'Rio de Janeiro', country: 'Brazil', coordinates: { lat: -22.90, lng: -43.18 }, type: 'hub', description: 'Key economic engine for Southeast Brazil.', annualTrafficTEU: '0.5 Million' },
  { id: 'buenos_aires', name: 'Port of Buenos Aires', city: 'Buenos Aires', country: 'Argentina', coordinates: { lat: -34.60, lng: -58.37 }, type: 'hub', description: 'Commercial gateway of Argentina.', annualTrafficTEU: '1.4 Million' },
  { id: 'valparaiso', name: 'Port of Valparaiso', city: 'Valparaiso', country: 'Chile', coordinates: { lat: -33.03, lng: -71.62 }, type: 'hub', description: 'Cultural and shipping center of Chile.', annualTrafficTEU: '0.8 Million' },
  { id: 'san_antonio', name: 'Port of San Antonio', city: 'San Antonio', country: 'Chile', coordinates: { lat: -33.58, lng: -71.61 }, type: 'hub', description: 'Chile\'s primary container terminal.', annualTrafficTEU: '1.6 Million' },
  { id: 'callao', name: 'Port of Callao', city: 'Lima/Callao', country: 'Peru', coordinates: { lat: -12.06, lng: -77.15 }, type: 'hub', description: 'Largest port on South America\'s Pacific coast.', annualTrafficTEU: '2.5 Million' },
  { id: 'guayaquil', name: 'Port of Guayaquil', city: 'Guayaquil', country: 'Ecuador', coordinates: { lat: -2.28, lng: -79.91 }, type: 'hub', description: 'Ecuador\'s main agricultural gateway.', annualTrafficTEU: '2.1 Million' },
  { id: 'cartagena', name: 'Port of Cartagena', city: 'Cartagena', country: 'Colombia', coordinates: { lat: 10.40, lng: -75.52 }, type: 'hub', description: 'Busiest container port in the Caribbean.', annualTrafficTEU: '3.2 Million' },
  { id: 'montevideo', name: 'Port of Montevideo', city: 'Montevideo', country: 'Uruguay', coordinates: { lat: -34.90, lng: -56.21 }, type: 'hub', description: 'Natural deepwater port in River Plate.', annualTrafficTEU: '0.9 Million' },

  // --- OCEANIA & AUSTRALIA ---
  { id: 'sydney', name: 'Port Botany', city: 'Sydney', country: 'Australia', coordinates: { lat: -33.97, lng: 151.22 }, type: 'hub', description: 'Principal gateway to New South Wales.', annualTrafficTEU: '2.6 Million' },
  { id: 'melbourne', name: 'Port of Melbourne', city: 'Melbourne', country: 'Australia', coordinates: { lat: -37.84, lng: 144.91 }, type: 'hub', description: 'Busiest container port in Australia.', annualTrafficTEU: '3.1 Million' },
  { id: 'brisbane', name: 'Port of Brisbane', city: 'Brisbane', country: 'Australia', coordinates: { lat: -27.38, lng: 153.16 }, type: 'hub', description: 'Queensland\'s premier trade hub.', annualTrafficTEU: '1.5 Million' },
  { id: 'perth', name: 'Fremantle Port', city: 'Perth', country: 'Australia', coordinates: { lat: -32.05, lng: 115.74 }, type: 'hub', description: 'Western Australia\'s major gateway.', annualTrafficTEU: '0.8 Million' },
  { id: 'adelaide', name: 'Port Adelaide', city: 'Adelaide', country: 'Australia', coordinates: { lat: -34.84, lng: 138.50 }, type: 'hub', description: 'Key commercial port for South Australia.', annualTrafficTEU: '0.4 Million' },
  { id: 'auckland', name: 'Ports of Auckland', city: 'Auckland', country: 'New Zealand', coordinates: { lat: -36.84, lng: 174.78 }, type: 'hub', description: 'Largest import terminal in New Zealand.', annualTrafficTEU: '0.9 Million' },
  { id: 'tauranga', name: 'Port of Tauranga', city: 'Tauranga', country: 'New Zealand', coordinates: { lat: -37.64, lng: 176.18 }, type: 'hub', description: 'Largest export gateway in New Zealand.', annualTrafficTEU: '1.2 Million' },

  // --- STRATEGIC GATEWAYS & CHOKEPOINTS ---
  { id: 'suez_canal', name: 'Suez Canal Gateway', city: 'Suez', country: 'Egypt', coordinates: { lat: 29.97, lng: 32.55 }, type: 'canal', description: 'Connects Mediterranean and Red Seas.', annualTrafficTEU: 'Transit Zone' },
  { id: 'panama_canal', name: 'Panama Canal Gateway', city: 'Panama City', country: 'Panama', coordinates: { lat: 8.98, lng: -79.52 }, type: 'canal', description: 'Connects Pacific and Atlantic Oceans.', annualTrafficTEU: 'Transit Zone' },
  { id: 'cape_good_hope', name: 'Cape of Good Hope Checkpoint', city: 'Cape Town', country: 'South Africa', coordinates: { lat: -34.35, lng: 18.47 }, type: 'checkpoint', description: 'Bypasses Suez Canal.', annualTrafficTEU: 'Bypass Zone' },
  { id: 'malacca_strait', name: 'Strait of Malacca Checkpoint', city: 'Malacca', country: 'Malaysia/Indonesia', coordinates: { lat: 2.50, lng: 101.50 }, type: 'checkpoint', description: 'Connects Indian and Pacific Oceans.', annualTrafficTEU: 'Transit Zone' }
];
