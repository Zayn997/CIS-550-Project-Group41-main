import React, { useState, useEffect } from "react";
import "./Navigation.css";
import "./Players.css"; // Your CSS file for styling
import pcBackground from "./image/player_card.png";
import axios from "axios";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";
import HomeIcon from "./image/home.svg";
import ncaaLogo from "./image/NCAA_icon.png";
import nbaLogo from "./image/NBA_icon.png";
import PlayersCard from "./helper/PlayersCard";
import PlayersCard_NCAA from "./helper/PlayersCard_NCAA";
import playerImagePath from "./playImageSample/Jason_Tatum.png"; // Update the path accordingly
import playerImagePath_NBA from "./playImageSample/victor-wembanyama.png"; // Update the path accordingly
import { rootURL } from "./config/config"; // Make sure this is the correct path
import icon from "./image/title_image.png";
import {
  allTeams,
  allPlayersInfo,
  ncaaAllPlayers,
  ncaaTeams,
  nbaCalculateRatings,
  ncaaCalculateRatings,
} from "./api/api.jsx";
import playerIcon from "./image/title_image.png"; // Ensure this path is correct

const Players = () => {
  const activeStyle = {
    backgroundColor: "#1E90FF",
  };

  const [ncaaTeam, setNcaaTeam] = useState([]);
  const [nbaTeam, setNbaTeam] = useState([]);
  const [selectedNbaTeam, setSelectedNbaTeam] = useState("");
  const [selectedNcaaTeam, setSelectedNcaaTeam] = useState("");
  const [player, setPlayer] = useState("");
  const [playerAvgSkills, setPlayAvgSkills] = useState("");
  const [season, setSeason] = useState("2015");
  const [NBAplayerInfo, setNBAPlayerInfo] = useState([]);
  const [NCAAplayerInfo, setNCAAPlayerInfo] = useState([]);

  useEffect(() => {
    const teams = async () => {
      const response = await allTeams();
      setNbaTeam(response);
    };
    teams();

    const ncaaTeam = async () => {
      const response = await ncaaTeams();
      setNcaaTeam(response);
    };
    ncaaTeam();
  }, [selectedNbaTeam, season]);

  const handleNBATeamChange = async (e) => {
    const newNBAName = e.target.value;
    setSelectedNbaTeam(newNBAName);

    if (newNBAName) {
      const playersResponse = await allPlayersInfo(newNBAName, season);
      if (Array.isArray(playersResponse)) {
        // Set player info immediately without ratings
        setNBAPlayerInfo(playersResponse);

        // Asynchronously update ratings for each player
        playersResponse.forEach(async (player) => {
          const ratingResponse = await nbaCalculateRatings(
            player.First_Name,
            player.Last_Name,
            season,
            "nba"
          );

          setNBAPlayerInfo((prevPlayers) =>
            prevPlayers.map((p) => {
              if (
                p.First_Name === player.First_Name &&
                p.Last_Name === player.Last_Name
              ) {
                // Update the player with the new rating
                return { ...p, Rating: ratingResponse.Calculated_Rating };
              }
              return p; // Return the player unchanged if it's not the one we updated
            })
          );
        });
      }
    }
  };

  const handleNCAATeamChange = async (e) => {
    const newNCCAName = e.target.value;
    setSelectedNcaaTeam(newNCCAName);

    if (newNCCAName) {
      const playersResponse = await ncaaAllPlayers(newNCCAName, season);
      if (Array.isArray(playersResponse)) {
        // Set player info immediately without ratings
        setNCAAPlayerInfo(playersResponse);

        // Asynchronously update ratings for each player
        playersResponse.forEach(async (player) => {
          const ratingResponse = await ncaaCalculateRatings(
            player.First_Name,
            player.Last_Name,
            season,
            "ncaa"
          );

          setNCAAPlayerInfo((prevPlayers) =>
            prevPlayers.map((p) => {
              if (
                p.First_Name === player.First_Name &&
                p.Last_Name === player.Last_Name
              ) {
                // Update the player with the new rating
                return { ...p, Rating: ratingResponse.Calculated_Rating };
              }
              return p; // Return the player unchanged if it's not the one we updated
            })
          );
        });
      }
    }
  };

  return (
    <div
      className="players-container"
      style={{
        backgroundImage: `url(${pcBackground})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        height: "100vh",
      }}
    >
      <div className="overlay"></div>

      <header className="players-header">
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
      </header>

      <div className="players-sections">
        {/* NBA Players Section */}
        <div className="players-section">
          <div className="header-container">
            <h2 className="fonts">NBA Players</h2>
            {/* Season selection dropdown */}
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="season-dropdown"
            >
              <option value="">Select a Season</option>
              {Array.from({ length: 2022 - 1980 }, (_, i) => 1980 + i).map(
                (year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                )
              )}
            </select>
          </div>

          <select onChange={handleNBATeamChange} value={selectedNbaTeam}>
            {nbaTeam &&
              nbaTeam.map((team) => (
                <option key={team.Team_Id} value={team.Team_Name}>
                  {team.Team_Name}
                </option>
              ))}
          </select>
          <div className="players-list">
            {NBAplayerInfo.map((player) => (
              <PlayersCard
                key={player.id} // Use a unique key for each player
                leagueName="NBA"
                player={player}
                imagePath={player.pic_url || playerIcon} // Use playerIcon as a fallback
                rating={player.Rating}
              />
            ))}
          </div>
        </div>
        <div class="loading2"></div>

        {/* NCAA Players Section */}
        <div className="players-section">
          <div className="header-container">
            <h2 className="fonts">NCAA Players</h2>
            {/* Season selection dropdown */}
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="season-dropdown"
            >
              <option value="">Select a Season</option>
              {Array.from({ length: 2022 - 1980 }, (_, i) => 1980 + i).map(
                (year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                )
              )}
            </select>
          </div>

          <select onChange={handleNCAATeamChange} value={selectedNcaaTeam}>
            {ncaaTeam &&
              ncaaTeam.map((team) => (
                <option key={team.team_full_name} value={team.team_full_name}>
                  {team.team_full_name}
                </option>
              ))}
          </select>

          {/* Populate options for NCAA teams */}
          <div className="players-list">
            {NCAAplayerInfo.map((player) => (
              <PlayersCard_NCAA
                key={player.id} // Use a unique key for each player
                league="NCAA"
                player={player}
                imagePath={player.pic_url || playerIcon} // Use playerIcon as a fallback
                rating={player.Rating}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Players;
