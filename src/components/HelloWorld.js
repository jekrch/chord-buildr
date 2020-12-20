import React from "react"
import {helloWorld} from "../utils/noteManager"

export const HelloWorld = () => {
    return (
        <div>  
            <h1>Hello World</h1>
            {helloWorld()}
        </div>
    )
}