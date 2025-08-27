import { useNavigate } from "react-router-dom";

const HomePage = () => {
    const navigate = useNavigate();

    const createRoom = ()=>{
       // call the backend /create-room api
        
    }
     navigate(`/chat/${newRoomId}`)

}


