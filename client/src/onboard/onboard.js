import React from 'react';
import { Redirect } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { Socket } from './socket.js';
import { mySocketId } from './socket.js';


class CreateNewGame extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isCreator:props.isCreator,
            formValue:'',
            nameEntered:false,
            gameId:'',
        };
        this.handleChange=this.handleChange.bind(this);
        this.handleSubmit=this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({formValue:event.target.value});
    }


    handleSubmit(event) {
        
        event.preventDefault()

        const newGameId=uuidv4();

        //Sends createNewGame signal to server with gameId
        Socket.emit('createNewGame',newGameId);

        //stores gameId in state so it can be accessed for url redirect in render
        //Sets nameEntered to True, causing redirect to waiting page
        this.setState({nameEntered:true,gameId:newGameId});

        //Sends player2Ready signal to server  
        if(this.state.isCreator===false) {
            Socket.emit('player2Ready')
        }
    }


    render() {
        if(this.state.isCreator & this.state.nameEntered) {
            return (
                <Redirect to={'/game/' + this.state.gameId}> </Redirect>
            );
        }
        else {
            return(
                <React.Fragment>
                    <h1> Your Username </h1>
                    <form onSubmit={this.handleSubmit}>
                    <label>
                        <input type="text" name="name" onChange={this.handleChange}/>
                    </label>
                    <input type="submit" value="Submit" />
                    </form>
                </React.Fragment> 
            );
            
        }
    }
}

const Onboard=() => {
    return <CreateNewGame/>
}

export default Onboard