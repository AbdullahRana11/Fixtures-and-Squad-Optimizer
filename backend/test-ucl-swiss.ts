import axios from 'axios';

async function testUCLSwiss() {
  try {
    console.log('Testing UCL Swiss Generation...');
    const response = await axios.post('http://localhost:3000/api/fixtures/generate', {
      league: 'ucl-swiss',
      config: {
        mode: 'auto',
        teams: [
          "Manchester City", "Real Madrid", "Bayern Munich", "PSG", "Liverpool", "Inter", "Leipzig", "Dortmund", "Barcelona",
          "Bayer Leverkusen", "Atletico Madrid", "Atalanta", "Juventus", "Benfica", "Arsenal", "Club Brugge", "Shakhtar Donetsk", "Milan",
          "Feyenoord", "Sporting CP", "PSV Eindhoven", "Dinamo Zagreb", "RB Salzburg", "Lille", "Crvena Zvezda", "Young Boys", "Celtic",
          "Slovan Bratislava", "Monaco", "Sparta Praha", "Aston Villa", "Bologna", "Girona", "Stuttgart", "Sturm Graz", "Brest"
        ]
      }
    });

    console.log('Status:', response.status);
    console.log('Season Name:', response.data.seasonName);
    console.log('Fixtures Count:', response.data.fixtures?.length);
    console.log('Rounds:', [...new Set(response.data.fixtures?.map((f: any) => f.round))].sort());
    
    if (response.data.fixtures?.length > 0) {
      console.log('First Fixture:', response.data.fixtures[0]);
      console.log('SUCCESS: UCL Swiss model generated fixtures.');
    } else {
      console.error('FAILURE: No fixtures generated.');
    }

    if (response.data.telemetry) {
        console.log('Telemetry:', response.data.telemetry);
    }

  } catch (error: any) {
    console.error('Error during test:', error.response?.data || error.message);
  }
}

testUCLSwiss();
