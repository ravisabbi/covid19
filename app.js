const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at https://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error : ${error.message}`);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// GET ALL STATES API
app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `SELECT * FROM state;`;
  const statesArray = await db.all(getAllStatesQuery);
  let stateList = statesArray.map((eachState) => {
    return convertDbObjectToResponseObject(eachState);
  });
  response.send(stateList);
});

// GET SINGLE STATE API
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id = '${stateId}';`;
  const state = await db.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(state));
});

// POST DISTRICT
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const createDistrictQuery = `INSERT INTO 
  district (district_name,state_id,cases,cured,active,deaths)
  VALUES(
      '${districtName}',
      ${stateId},
      '${cases}',
      '${cured}',
      '${active}',
      '${deaths}');`;
  await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

// GET SINGLE DISTRICT API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const dbResponse = await db.get(getDistrictQuery);
  //console.log(convertDistrictDbToResponseObject(dbResponse));
  response.send(convertDistrictDbToResponseObject(dbResponse));
});

// DELETE DISTRICT API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// UPDATE single district API

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictQuery = `
     UPDATE 
     district
     SET 
     district_name = '${districtName}',
     state_id = ${stateId},
     cases = ${cases},
     cured = ${cured},
     active = ${active},
     deaths = ${deaths}
     WHERE 
     district_id = ${districtId};`;

  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// GET STATISTICS OF STATE API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatisticsOfStateQuery = `SELECT
                                        SUM(cases) AS totalCases,
                                        SUM(cured) AS totalCured,
                                        SUM(active) AS totalActive,
                                        SUM(deaths) AS totalDeaths
                                       FROM 
                                        district 
                                       WHERE 
                                        state_id = ${stateId};`;
  const stateStatistics = await db.get(getStatisticsOfStateQuery);

  console.log(stateStatistics);
  response.send(stateStatistics);
});

// GET STATE NAME OF THE DISTRICT API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `SELECT 
     state_name AS stateName
      FROM 
      district NATURAL JOIN state
    WHERE 
    district.district_id = ${districtId};`;
  const stateNameObj = await db.get(getStateNameQuery);

  response.send(stateNameObj);
});

module.exports = app;
