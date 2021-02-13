import React, { useContext } from "react"
import "../../styles/Layout.css"
import { AppContext } from "../context/AppContext"

export const HeaderComponent = () => {
	const { state } = useContext(AppContext)

	const renderProgression = () => {
		return state.chordPianoSet.map((piano, i) => {
			return (
				<li key={i}>
					&nbsp;{piano.selectedChord.noteLetter}
					{piano.selectedChord.type}&nbsp;|
				</li>
			)
		})
	}
	return (
		<>
			<header className="mainHeader">
				<h1>Chord Buildr</h1>
				<ul className="progression" style={{ listStyle: "none" }}>
					{renderProgression()}
				</ul>
			</header>
		</>
	)
}
