import {React, useState } from "react"
import Form from "react-bootstrap/Form"
import { noteLetterMapWithSharps, noteLetterArray } from '../utils/noteManager'
import { chordMap } from '../utils/chordManager'
//import { options } from "./ChordInput"


  
export const ChordInput = () => {

    // const handleSelectChange = ([]) => {
    //     console.log('yo')
    //     return ["1", ["1", "2"]];
    //     // 
    // }

    var chordTypeArray = Object.keys(chordMap);
    var noteArray = Object.values(noteLetterMapWithSharps);

    //<!--<Form.Label>Note: </Form.Label><Form.Label>Type: </Form.Label><br/>-->
    return ( 

        <Form>
        <Form.Group controlId="exampleForm.SelectCustom">
            
            <Form.Control as="select" custom> 
                {
                    noteArray.map((option, index) => {
                        return (
                        <option key={index} value={option}>{option}</option>)
                     })
                }

            </Form.Control><b>   </b>
            <Form.Control as="select" custom> 
                {
                    chordTypeArray.map((option, index) => {
                        return (
                        <option key={index} value={option}>{option}</option>)
                     })
                }

            </Form.Control>
        </Form.Group>

        <br/>
        </Form>
    )

}
