import React, { useState, useEffect } from "react";
import "./NBA.css";
import PlayerItem from "./helper/PlayerItem";
import HighlightPlayerCard from "./helper/HighlightPlayerCard";
import TeamInfoRow from "./helper/TeamInfoRow";
import nbaIconPath from "./image/NBA_icon.png";
import { Link, NavLink } from "react-router-dom";
import HomeIcon from "./image/home.svg";
import bgPicture2 from "./image/bg_2_picture.png";
import { allTeams } from "./api/api"; // Make sure this path is correct

// Assuming that '0' is the league number for NBA
const conferenceToLeagueNumber = {
  "Western Conference": 0,
  "Eastern Conference": 0,
};
const conferenceList = ["Western Conference", "Eastern Conference"];
const teamsByConference = {
  "Western Conference": [
    { abbreviation: "DAL", fullName: "Dallas Mavericks" },
    { abbreviation: "DEN", fullName: "Denver Nuggets" },
    { abbreviation: "GSW", fullName: "Golden State Warriors" },
    { abbreviation: "HOU", fullName: "Houston Rockets" },
    { abbreviation: "LAC", fullName: "Los Angeles Clippers" },
    { abbreviation: "LAL", fullName: "Los Angeles Lakers" },
    { abbreviation: "MEM", fullName: "Memphis Grizzlies" },
    { abbreviation: "MIN", fullName: "Minnesota Timberwolves" },
    { abbreviation: "NOP", fullName: "New Orleans Pelicans" },
    { abbreviation: "OKC", fullName: "Oklahoma City Thunder" },
    { abbreviation: "PHO", fullName: "Phoenix Suns" },
    { abbreviation: "POR", fullName: "Portland Trail Blazers" },
    { abbreviation: "SAC", fullName: "Sacramento Kings" },
    { abbreviation: "SAS", fullName: "San Antonio Spurs" },
    { abbreviation: "UTA", fullName: "Utah Jazz" },
  ],
  "Eastern Conference": [
    { abbreviation: "ATL", fullName: "Atlanta Hawks" },
    { abbreviation: "BKN", fullName: "Brooklyn Nets" },
    { abbreviation: "BOS", fullName: "Boston Celtics" },
    { abbreviation: "CHA", fullName: "Charlotte Hornets" },
    { abbreviation: "CHI", fullName: "Chicago Bulls" },
    { abbreviation: "CLE", fullName: "Cleveland Cavaliers" },
    { abbreviation: "DET", fullName: "Detroit Pistons" },
    { abbreviation: "IND", fullName: "Indiana Pacers" },
    { abbreviation: "MIA", fullName: "Miami Heat" },
    { abbreviation: "MIL", fullName: "Milwaukee Bucks" },
    { abbreviation: "NYK", fullName: "New York Knicks" },
    { abbreviation: "ORL", fullName: "Orlando Magic" },
    { abbreviation: "PHI", fullName: "Philadelphia 76ers" },
    { abbreviation: "TOR", fullName: "Toronto Raptors" },
    { abbreviation: "WAS", fullName: "Washington Wizards" },
  ],
};

const NBA = () => {
  const [selectedConference, setSelectedConference] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  // Get top players for the selected team and season
  const [topPlayers, setTopPlayers] = useState([]);
  // Static team data for demonstration
  const [teamData, setTeamData] = useState({ seasons: [] }); // Default state for teamData
  const activeStyle = {
    backgroundColor: "#1E90FF",
  };

  // Fetch teams when a conference is selected
  useEffect(() => {
    allTeams("0").then((data) => {
      console.log("data", data);
      setTeams(data);
    });
    // const response = allTeams('0');
    // console.log('response', response);
    // setTeams(response);
  }, []);

  // Handle conference selection
  const handleConferenceSelect = (event) => {
    setSelectedConference(event.target.value);

    // If a conference is selected, filter the teams based on the conference
    if (event.target.value) {
      const filteredTeams = teamsByConference[event.target.value];
      setTeams(filteredTeams);
    } else {
      // If no conference is selected, reset the teams to the full list
      setTeams([]);
    }
  };

  // Handle team selection
  const handleTeamSelect = (event) => {
    const teamAbbreviation = event.target.value;
    const conferenceTeams = teamsByConference[selectedConference];
    const team = conferenceTeams.find(
      (t) => t.abbreviation === teamAbbreviation
    );
    setSelectedTeam(team); // team is an object here
  };

  // Handle season change
  const handleSeasonChange = (event) => {
    setSelectedSeason(event.target.value);
  };

  return (
    <div
      className="nba-container"
      style={{ backgroundImage: `url(${bgPicture2})` }}
    >
      <div className="overlay"></div>

      <header className="nba-header">
        {/* Navigation links */}
        <nav className="navigation-links">
          <NavLink
            to="/NCAA"
            className="navigation-link"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
          >
            NCAA Teams
          </NavLink>
          <NavLink
            to="/NBA"
            className="navigation-link"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
          >
            NBA Teams
          </NavLink>
          <NavLink
            to="/Players"
            className="navigation-link"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
          >
            Players
          </NavLink>
          <NavLink
            to="/Predictors"
            className="navigation-link"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
          >
            Predictors
          </NavLink>
          <NavLink
            to="/PlayerComparison"
            className="navigation-link"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
          >
            In the lab
          </NavLink>
          <Link to="/" className="home-icon-link">
            <img
              src={HomeIcon}
              alt="Home"
              className="navigation-link home-icon"
            />
          </Link>
        </nav>

        {/* Dropdown for All Conferences */}
        <div className="dropdown">
          <select
            className="conference-dropdown"
            onChange={handleConferenceSelect}
            value={selectedConference}
          >
            <option value="">All Conferences</option>
            {conferenceList.map((conference) => (
              <option key={conference} value={conference}>
                {conference}
              </option>
            ))}
          </select>

          {/* Teams Dropdown - only shown when a conference is selected */}
          {selectedConference && (
            <select
              className="team-dropdown"
              onChange={handleTeamSelect}
              value={selectedTeam}
              disabled={!selectedConference}
            >
              <option value="">Select Team</option>
              {teams.map((team) => (
                <option key={team.abbreviation} value={team.abbreviation}>
                  {team.fullName}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>
      <div className="loading"></div>
      <div className="main-content">
        {/* Conditionally render TeamInfoRow only if a team is selected */}
        {selectedTeam && (
          <TeamInfoRow
            teamType="NBA"
            teamData={teamData}
            teamName={selectedTeam.abbreviation}
            fullTeamName={selectedTeam.fullName}
            playersData={players}
            nbaIconPath={nbaIconPath}
            selectedSeason={selectedSeason}
            handleSeasonChange={handleSeasonChange}
          />
        )}
      </div>

      {/*Scrollable frame for player items*/}
      {/* Highlighted player cards for top performers */}
      {/* <div className="highlighted-players">
        {topPlayers.map((player, index) => (
          <HighlightPlayerCard
            key={index}
            player={player}
            statCategory={`Most ${Object.keys(player.stats)[0]}`}
            statValue={Object.values(player.stats)[0]}
          />
        ))}
      </div> */}
    </div>
  );
};

export default NBA;
