const mysql = require("mysql");
const config = require("./config.json");

// Creates MySQL connection using database credential provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
const connection = mysql.createConnection({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db,
});
connection.connect((err) => err && console.log(err));

/******************
 * WARM UP ROUTES *
 ******************/
const get = async (req, res) => {
  res.json("hello word");
};

const getPlayersByTeamName = (teamName, isNBA) => {
  const table = isNBA ? "NBA_Player_Rating" : "NCAA_Player";
  const query = `SELECT * FROM ${table} WHERE Team_Name = ?`;

  return new Promise((resolve, reject) => {
    connection.query(query, [teamName], (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
};

const allPlayers = async (req, res) => {
  const { teamName } = req.query;
  const table = "NBA_Player_Rating";

  const sqlQuery = `
    SELECT First_Name, Last_Name, Height, Weight, Team_Name, Jersey_Number, pic_url
    FROM ${table}
    WHERE Team_Name = ?;
  `;

  connection.query(sqlQuery, [teamName], (err, data) => {
    console.log("sqlQuery:", sqlQuery);
    if (err || data.length === 0) {
      console.log(err);
      res.status(400).json({ error: "Query failed" });
    } else {
      res.status(200).json(data);
    }
  });
};

const allTeams = async (req, res) => {
  const table = "NBA_Team";

  if (table !== "NBA_Team" && table !== "NCAA_Team") {
    return res.status(400).json({ error: "Invalid league specified" });
  }

  connection.query(
    `
    SELECT *
    FROM ${table};
  `,
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.status(400).json({ error: "Query failed" });
      } else {
        res.status(200).json(data);
      }
    }
  );
};

const ncaaAllTeams = async (req, res) => {
  const table = "NCAA_Team";

  if (table !== "NBA_Team" && table !== "NCAA_Team") {
    return res.status(400).json({ error: "Invalid league specified" });
  }

  connection.query(
    `
    SELECT *
    FROM ${table};
  `,
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.status(400).json({ error: "Query failed" });
      } else {
        res.status(200).json(data);
      }
    }
  );
};

const playerInfo = async (req, res) => {
  const { teamName, firstName, lastName } = req.query;

  if (!teamName || !firstName || !lastName) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const league = "NBA_Player_Rating";

  let sqlQuery = `SELECT First_Name, Last_Name, Height, Weight, Jersey_Number, Position, Overall_Rating, pic_url FROM ${league} WHERE Team_Name = ? AND First_Name = ? AND Last_Name = ?`;
  let queryParams = [teamName, firstName, lastName];

  // Execute the query
  connection.query(sqlQuery, queryParams, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Query failed" });
    }
    if (data.length === 0) {
      return res.status(404).json({ error: "No data found" });
    }
    res.status(200).json(data);
  });
};

const ncaaPlayerInfo = async (req, res) => {
  const { teamName, firstName, lastName } = req.query;

  if (!teamName || !firstName || !lastName) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const league = "ncaa_player_performance";

  let sqlQuery = `SELECT DISTINCT First_Name, Last_Name, Team_Name, Position FROM ${league} WHERE Team_Name = ? AND First_Name = ? AND Last_Name = ?`;
  let queryParams = [teamName, firstName, lastName];

  // Execute the query
  connection.query(sqlQuery, queryParams, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Query failed" });
    }
    if (data.length === 0) {
      return res.status(404).json({ error: "No data found" });
    }
    res.status(200).json(data);
  });
};

const allPlayersInfo = async (req, res) => {
  const { teamName, seasonName } = req.query;

  if (!teamName && !seasonName) {
    return res.status(400).json({
      error:
        "Missing required parameters: either teamName or schoolName, and leagueName",
    });
  }

  const playerTable = "NBA_Player_Rating";

  let sqlQuery = `
    SELECT distinct pp.First_Name, pp.Last_Name, pt.Height, pt.Weight, pt.Jersey_Number`;

  if (playerTable === "NBA_Player_Rating") {
    sqlQuery += ", pt.pic_url";
    sqlQuery += ", pt.Position";
    sqlQuery += ", pt.College";
    sqlQuery += ", pt.Country";
    sqlQuery += ", pt.Overall_Rating";
  }

  sqlQuery += `
    FROM nba_player_performance pp
    JOIN ${playerTable} pt ON pp.First_Name = pt.First_Name AND pp.Last_Name = pt.Last_Name
    WHERE `;

  sqlQuery += `pp.Team_Name = ?`;

  let queryParams = [teamName];

  if (seasonName) {
    sqlQuery += " AND pp.Season = ?";
    queryParams.push(seasonName);
  }

  connection.query(sqlQuery, queryParams, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Query failed: " + err.message });
    }
    if (data.length === 0) {
      return res.status(200).json({
        data: [],
        message: "No players found for the specified team and season",
      });
    }
    res.status(200).json(data);
  });
};

const playerAvgSkills = async (req, res) => {
  const { teamName, seasonName, firstName, lastName } = req.query;

  // Validate required parameters
  if (!teamName || !seasonName || !firstName || !lastName) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const sqlQuery = `
  SELECT
  Team_Name,
  First_Name,
  Last_Name,
  Season,
  pic_url,
  AVG(CAST(PTS AS UNSIGNED)) AS Avg_PTS,
  AVG(CAST(REB AS UNSIGNED)) AS Avg_REB,
  AVG(CAST(AST AS UNSIGNED)) AS Avg_AST,
  AVG(CAST(STL AS UNSIGNED)) AS Avg_STL,
  AVG(CAST(BLK AS UNSIGNED)) AS Avg_BLK,
  AVG(CAST(FG3_PCT AS FLOAT)) AS Avg_FG3_PCT,
  AVG(CAST(FG_PCT AS FLOAT)) AS Avg_FG_PCT,
  AVG(CAST(FT_PCT AS FLOAT)) AS Avg_FT_PCT,
  AVG(CAST(OREB AS UNSIGNED)) AS Avg_OREB,
  AVG(CAST(DREB AS UNSIGNED)) AS Avg_DREB,
  AVG(CAST(TOV AS UNSIGNED)) AS Avg_TOV,
  AVG(CAST(MIN AS UNSIGNED)) AS Avg_MIN
FROM
  nba_player_performance
WHERE
  Team_Name = ? AND Season = ? AND First_Name = ? AND Last_Name = ?
GROUP BY
  Team_Name, First_Name, Last_Name;
  `;

  // Array of parameters for the SQL query
  const queryParams = [teamName, seasonName, firstName, lastName];

  // Execute the query
  connection.query(sqlQuery, queryParams, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Query failed" });
    }
    if (data.length === 0) {
      return res.status(404).json({ error: "No data found" });
    }
    res.status(200).json(data);
  });
};

const teamAvgSkills = async (req, res) => {
  const { teamName, seasonName } = req.query;

  // Validate required parameters
  if (!teamName || !seasonName) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const sqlQuery = `
  SELECT
  Team_Name,
  Season,
  AVG(CAST(PTS AS UNSIGNED)) AS Avg_PTS,
  AVG(CAST(REB AS UNSIGNED)) AS Avg_REB,
  AVG(CAST(AST AS UNSIGNED)) AS Avg_AST,
  AVG(CAST(STL AS UNSIGNED)) AS Avg_STL,
  AVG(CAST(BLK AS UNSIGNED)) AS Avg_BLK,
  AVG(CAST(FG3_PCT AS FLOAT)) AS Avg_FG3_PCT,
  AVG(CAST(FG_PCT AS FLOAT)) AS Avg_FG_PCT,
  AVG(CAST(FT_PCT AS FLOAT)) AS Avg_FT_PCT,
  AVG(CAST(OREB AS UNSIGNED)) AS Avg_OREB,
  AVG(CAST(DREB AS UNSIGNED)) AS Avg_DREB,
  AVG(CAST(TOV AS UNSIGNED)) AS Avg_TOV,
  AVG(CAST(MIN AS UNSIGNED)) AS Avg_MIN
FROM
  nba_player_performance
WHERE
  Team_Name = ? AND Season = ? 
GROUP BY
  Team_Name
  `;

  // Array of parameters for the SQL query
  const queryParams = [teamName, seasonName];

  // Execute the query
  connection.query(sqlQuery, queryParams, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Query failed" });
    }
    if (data.length === 0) {
      return res.status(404).json({ error: "No data found" });
    }
    res.status(200).json(data);
  });
};

const ncaaTeamAvgSkills = async (req, res) => {
  const { team_full_name, seasonName } = req.query;

  // Validate required parameters
  if (!team_full_name || !seasonName) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const sqlQuery = `
  SELECT
  team_full_name,
  Season,
  AVG(CAST(PTS AS UNSIGNED)) AS Avg_PTS,
  AVG(CAST(REB AS UNSIGNED)) AS Avg_REB,
  AVG(CAST(AST AS UNSIGNED)) AS Avg_AST,
  AVG(CAST(STL AS UNSIGNED)) AS Avg_STL,
  AVG(CAST(BLK AS UNSIGNED)) AS Avg_BLK,
  AVG(CAST(FG3_PCT AS FLOAT)) AS Avg_FG3_PCT,
  AVG(CAST(FG_PCT AS FLOAT)) AS Avg_FG_PCT,
  AVG(CAST(FT_PCT AS FLOAT)) AS Avg_FT_PCT,
  AVG(CAST(OREB AS UNSIGNED)) AS Avg_OREB,
  AVG(CAST(DREB AS UNSIGNED)) AS Avg_DREB,
  AVG(CAST(TOV AS UNSIGNED)) AS Avg_TOV,
  AVG(CAST(MIN AS UNSIGNED)) AS Avg_MIN
FROM
  ncaa_player_performance
WHERE
  team_full_name = ? AND Season = ? 
GROUP BY
  team_full_name
  `;

  // Array of parameters for the SQL query
  const queryParams = [team_full_name, seasonName];

  // Execute the query
  connection.query(sqlQuery, queryParams, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Query failed" });
    }
    if (data.length === 0) {
      return res.status(404).json({ error: "No data found" });
    }
    res.status(200).json(data);
  });
};

const playerTopFive = async (req, res) => {
  const { teamName, seasonName, firstName, lastName } = req.query;

  // Validate required parameters
  if (!teamName || !firstName || !lastName) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  let sqlQuery = `
    WITH PTS_Top AS (
      SELECT SUM(CAST(PTS AS UNSIGNED)) AS Total_PTS
      FROM nba_player_performance
      WHERE Team_Name = ? AND First_Name = ? AND Last_Name = ?`;

  let queryParams = [teamName, firstName, lastName];

  if (seasonName) {
    sqlQuery += ` AND Season = ?`;
    queryParams.push(seasonName);
  }

  const skills = ["REB", "AST", "STL", "BLK"];
  skills.forEach((skill) => {
    sqlQuery += `),
    ${skill}_Top AS (
      SELECT SUM(CAST(${skill} AS UNSIGNED)) AS Total_${skill}
      FROM nba_player_performance
      WHERE Team_Name = ? AND First_Name = ? AND Last_Name = ?`;

    if (seasonName) {
      sqlQuery += ` AND Season = ?`;
    }

    queryParams.push(teamName, firstName, lastName);
    if (seasonName) {
      queryParams.push(seasonName);
    }
  });

  sqlQuery += `)
  -- Final SELECT with UNION ALL
  SELECT 'PTS' AS Skill, Total_PTS FROM PTS_Top
  UNION ALL
  SELECT 'REB' AS Skill, Total_REB FROM REB_Top
  UNION ALL
  SELECT 'AST' AS Skill, Total_AST FROM AST_Top
  UNION ALL
  SELECT 'STL' AS Skill, Total_STL FROM STL_Top
  UNION ALL
  SELECT 'BLK' AS Skill, Total_BLK FROM BLK_Top`;

  // Execute the query
  connection.query(sqlQuery, queryParams, (err, data) => {
    if (err || data.length === 0) {
      console.error(err);
      res.status(400).json({ error: "Query failed" });
    } else {
      res.status(200).json(data);
    }
  });
};

const ncaaPlayerTopFive = async (req, res) => {
  const { team_full_name, firstName, lastName } = req.query;

  // Validate required parameters
  if (!team_full_name || !firstName || !lastName) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  let sqlQuery = `
    WITH PTS_Top AS (
      SELECT SUM(CAST(PTS AS UNSIGNED)) AS Total_PTS
      FROM ncaa_player_performance
      WHERE team_full_name = ? AND First_Name = ? AND Last_Name = ?`;

  let queryParams = [team_full_name, firstName, lastName];

  const skills = ["REB", "AST", "STL", "BLK"];
  skills.forEach((skill) => {
    sqlQuery += `),
    ${skill}_Top AS (
      SELECT SUM(CAST(${skill} AS UNSIGNED)) AS Total_${skill}
      FROM ncaa_player_performance
      WHERE team_full_name = ? AND First_Name = ? AND Last_Name = ?`;
    queryParams.push(team_full_name, firstName, lastName);
  });

  sqlQuery += `)
  -- Final SELECT with UNION ALL
  SELECT 'PTS' AS Skill, Total_PTS FROM PTS_Top
  UNION ALL
  SELECT 'REB' AS Skill, Total_REB FROM REB_Top
  UNION ALL
  SELECT 'AST' AS Skill, Total_AST FROM AST_Top
  UNION ALL
  SELECT 'STL' AS Skill, Total_STL FROM STL_Top
  UNION ALL
  SELECT 'BLK' AS Skill, Total_BLK FROM BLK_Top`;

  // Execute the query
  connection.query(sqlQuery, queryParams, (err, data) => {
    if (err || data.length === 0) {
      console.error(err);
      res.status(400).json({ error: "Query failed: " + err.message });
    } else {
      res.status(200).json(data);
    }
  });
};

const teamTopFive = async (req, res) => {
  const { teamName, seasonName } = req.query;

  // Validate required parameters
  if (!teamName || !seasonName) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  let sqlQuery = `
    WITH PTS_Top AS (
      SELECT np.First_Name, np.Last_Name, SUM(CAST(np.PTS AS UNSIGNED)) AS Total_PTS, nr.pic_url
      FROM nba_player_performance np
      LEFT JOIN NBA_Player_Rating nr ON np.First_Name = nr.First_Name AND np.Last_Name = nr.Last_Name
      WHERE np.Team_Name = ? AND np.Season = ?
      GROUP BY np.First_Name, np.Last_Name
      ORDER BY Total_PTS DESC LIMIT 1
    `;

  let queryParams = [teamName, seasonName];

  const skills = ["REB", "AST", "STL", "BLK"];
  skills.forEach((skill, index) => {
    sqlQuery += `),
    ${skill}_Top AS (
      SELECT np.First_Name, np.Last_Name, SUM(CAST(np.${skill} AS UNSIGNED)) AS Total_${skill}, nr.pic_url
      FROM nba_player_performance np
      LEFT JOIN NBA_Player_Rating nr ON np.First_Name = nr.First_Name AND np.Last_Name = nr.Last_Name
      WHERE np.Team_Name = ? AND np.Season = ?
      GROUP BY np.First_Name, np.Last_Name
      ORDER BY Total_${skill} DESC LIMIT 1
    `;
    queryParams.push(teamName, seasonName);
  });

  sqlQuery += `)
  SELECT 'PTS' AS Skill, First_Name, Last_Name, Total_PTS, pic_url FROM PTS_Top
  UNION ALL
  SELECT 'REB' AS Skill, First_Name, Last_Name, Total_REB, pic_url FROM REB_Top
  UNION ALL
  SELECT 'AST' AS Skill, First_Name, Last_Name, Total_AST, pic_url FROM AST_Top
  UNION ALL
  SELECT 'STL' AS Skill, First_Name, Last_Name, Total_STL, pic_url FROM STL_Top
  UNION ALL
  SELECT 'BLK' AS Skill, First_Name, Last_Name, Total_BLK, pic_url FROM BLK_Top`;

  // Execute the query
  connection.query(sqlQuery, queryParams, (err, data) => {
    if (err || data.length === 0) {
      console.error(err);
      res.status(400).json({ error: "Query failed" });
    } else {
      res.status(200).json(data);
    }
  });
};

const ncaaAllPlayers = async (req, res) => {
  const { team_full_name } = req.query;

  if (!team_full_name) {
    return res.status(400).json({
      error: "Missing required parameter: team_full_name",
    });
  }

  const performanceTable = "ncaa_player_performance";
  const playerTable = "NCAA_Player";

  let sqlQuery = `
    SELECT DISTINCT 
      np.First_Name, 
      np.Last_Name, 
      np.team_full_name, 
      np.Position,
      pl.Height, 
      pl.Weight, 
      pl.Jersey_Number, 
      pl.Birth_Place
    FROM ${performanceTable} np
    JOIN ${playerTable} pl ON 
      np.First_Name = pl.First_Name AND 
      np.Last_Name = pl.Last_Name
    WHERE np.team_full_name = ?`;

  let queryParams = [team_full_name];

  connection.query(sqlQuery, queryParams, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Query failed: " + err.message });
    }
    if (data.length === 0) {
      return res
        .status(404)
        .json({ error: "No players found for the specified team_full_name" });
    }
    res.status(200).json(data);
  });
};

const ncaaTopFive = async (req, res) => {
  const { team_full_name } = req.query;

  let sqlQuery = `
  WITH PTS_Top AS (
    SELECT Team_Name, First_Name, Last_Name, AVG(CAST(PTS AS UNSIGNED)) AS Total_PTS
    FROM ncaa_player_performance
    ${team_full_name ? "WHERE team_full_name = ?" : ""}
    GROUP BY Team_Name, First_Name, Last_Name
    ORDER BY Total_PTS DESC
    LIMIT 1
  ),
  REB_Top AS (
    SELECT Team_Name, First_Name, Last_Name, AVG(CAST(REB AS UNSIGNED)) AS Total_REB
    FROM ncaa_player_performance
    ${team_full_name ? "WHERE team_full_name = ?" : ""}
    GROUP BY Team_Name, First_Name, Last_Name
    ORDER BY Total_REB DESC
    LIMIT 1
  ),
  AST_Top AS (
    SELECT Team_Name, First_Name, Last_Name, AVG(CAST(AST AS UNSIGNED)) AS Total_AST
    FROM ncaa_player_performance
    ${team_full_name ? "WHERE team_full_name = ?" : ""}
    GROUP BY Team_Name, First_Name, Last_Name
    ORDER BY Total_AST DESC
    LIMIT 1
  ),
  STL_Top AS (
    SELECT Team_Name, First_Name, Last_Name, AVG(CAST(STL AS UNSIGNED)) AS Total_STL
    FROM ncaa_player_performance
    ${team_full_name ? "WHERE team_full_name = ?" : ""}
    GROUP BY Team_Name, First_Name, Last_Name
    ORDER BY Total_STL DESC
    LIMIT 1
  ),
  BLK_Top AS (
    SELECT Team_Name, First_Name, Last_Name, AVG(CAST(BLK AS UNSIGNED)) AS Total_BLK
    FROM ncaa_player_performance
    ${team_full_name ? "WHERE team_full_name = ?" : ""}
    GROUP BY Team_Name, First_Name, Last_Name
    ORDER BY Total_BLK DESC
    LIMIT 1
  )

  SELECT 'PTS' AS Skill, Team_Name, First_Name, Last_Name, Total_PTS FROM PTS_Top
  UNION ALL
  SELECT 'REB' AS Skill, Team_Name, First_Name, Last_Name, Total_REB FROM REB_Top
  UNION ALL
  SELECT 'AST' AS Skill, Team_Name, First_Name, Last_Name, Total_AST FROM AST_Top
  UNION ALL
  SELECT 'STL' AS Skill, Team_Name, First_Name, Last_Name, Total_STL FROM STL_Top
  UNION ALL
  SELECT 'BLK' AS Skill, Team_Name, First_Name, Last_Name, Total_BLK FROM BLK_Top;`;

  let queryParams = team_full_name
    ? [
        team_full_name,
        team_full_name,
        team_full_name,
        team_full_name,
        team_full_name,
      ]
    : [];

  connection.query(sqlQuery, queryParams, (err, data) => {
    if (err || data.length === 0) {
      console.error(err);
      res.status(400).json({ error: "Query failed: " + err.message });
    } else {
      res.status(200).json(data);
    }
  });
};

const ncaaPlayerAvgSkills = async (req, res) => {
  const { team_full_name, firstName, lastName } = req.query;

  // Validate required parameters
  if (!team_full_name || !firstName || !lastName) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const sqlQuery = `
  SELECT
    team_full_name,
    First_Name,
    Last_Name,
    AVG(CAST(PTS AS UNSIGNED)) AS Avg_PTS,
    AVG(CAST(REB AS UNSIGNED)) AS Avg_REB,
    AVG(CAST(AST AS UNSIGNED)) AS Avg_AST,
    AVG(CAST(STL AS UNSIGNED)) AS Avg_STL,
    AVG(CAST(BLK AS UNSIGNED)) AS Avg_BLK,
    AVG(CAST(FG3_PCT AS FLOAT)) AS Avg_FG3_PCT,
    AVG(CAST(FG_PCT AS FLOAT)) AS Avg_FG_PCT,
    AVG(CAST(FT_PCT AS FLOAT)) AS Avg_FT_PCT,
    AVG(CAST(OREB AS UNSIGNED)) AS Avg_OREB,
    AVG(CAST(DREB AS UNSIGNED)) AS Avg_DREB,
    AVG(CAST(TOV AS UNSIGNED)) AS Avg_TOV,
    AVG(CAST(MIN AS UNSIGNED)) AS Avg_MIN
  FROM
    ncaa_player_performance
  WHERE
    team_full_name = ? AND First_Name = ? AND Last_Name = ?
  GROUP BY
    team_full_name, First_Name, Last_Name
  LIMIT 20;
  `;

  // Array of parameters for the SQL query
  const queryParams = [team_full_name, firstName, lastName];

  // Execute the query
  connection.query(sqlQuery, queryParams, (err, data) => {
    if (err || data.length === 0) {
      console.error(err);
      res.status(400).json({ error: "Query failed: " + err.message });
    } else {
      res.status(200).json(data);
    }
  });
};

const calculatePlayerRating = (playerStats) => {
  const rating = Math.round(
    (playerStats.PTS * 0.2 +
      playerStats.REB * 0.15 +
      playerStats.AST * 0.15 +
      playerStats.STL * 0.1 +
      playerStats.BLK * 0.1 +
      playerStats.FG3_PCT * 0.1 +
      playerStats.FG_PCT * 0.1 +
      playerStats.FT_PCT * 0.1) *
      4.95 +
      61
  );
  return Math.max(68, Math.min(rating, 99)); // Clamp the rating between 68 and 99
};

const nbacalculateRatingEndpoint = (req, res) => {
  const { firstName, lastName, season, league } = req.query;

  if (!firstName || !lastName || !season || !league) {
    return res.status(400).json({
      error:
        "Missing required parameters: firstName, lastName, season, and league.",
    });
  }

  const table =
    league.toLowerCase() === "nba"
      ? "nba_player_performance"
      : "ncaa_player_performance";

  let sqlQuery = `
    SELECT PTS, REB, AST, STL, BLK, FG3_PCT, FG_PCT, FT_PCT 
    FROM ${table} 
    WHERE First_Name = ? AND Last_Name = ? AND Season = ?
  `;

  connection.query(sqlQuery, [firstName, lastName, season], (err, stats) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Query failed: " + err.message });
    }

    if (stats.length === 0) {
      return res.status(404).json({
        error: `No ${league.toUpperCase()} player stats found for the provided information.`,
      });
    }

    const playerStats = stats[0];
    const calculatedRating = calculatePlayerRating(playerStats);

    res.status(200).json({
      firstName,
      lastName,
      season,
      league,
      Calculated_Rating: calculatedRating,
    });
  });
};

const ncaacalculateRatingEndpoint = (req, res) => {
  const { firstName, lastName, season, league } = req.query;

  if (!firstName || !lastName || !season || !league) {
    return res.status(400).json({
      error:
        "Missing required parameters: firstName, lastName, season, and league.",
    });
  }

  const table =
    league.toLowerCase() === "nba"
      ? "nba_player_performance"
      : "ncaa_player_performance";

  let sqlQuery = `
    SELECT PTS, REB, AST, STL, BLK, FG3_PCT, FG_PCT, FT_PCT 
    FROM ${table} 
    WHERE First_Name = ? AND Last_Name = ? AND Season = ?
  `;

  connection.query(sqlQuery, [firstName, lastName, season], (err, stats) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Query failed: " + err.message });
    }

    if (stats.length === 0) {
      return res.status(404).json({
        error: `No ${league.toUpperCase()} player stats found for the provided information.`,
      });
    }

    const playerStats = stats[0];
    const calculatedRating = calculatePlayerRating(playerStats);

    res.status(200).json({
      firstName,
      lastName,
      season,
      league,
      Calculated_Rating: calculatedRating,
    });
  });
};

module.exports = {
  get,
  getPlayersByTeamName,
  allPlayers,
  allTeams,
  teamTopFive,
  playerInfo,
  allPlayersInfo,
  playerAvgSkills,
  playerTopFive,
  ncaaAllPlayers,
  ncaaTopFive,
  ncaaPlayerAvgSkills,
  ncaaAllTeams,
  teamAvgSkills,
  ncaaPlayerInfo,
  ncaaTeamAvgSkills,
  ncaaPlayerTopFive,
  nbacalculateRatingEndpoint,
  ncaacalculateRatingEndpoint,
};
