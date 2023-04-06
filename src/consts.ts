const TickRate = 16;
const MaxPlayers = 5000;
const PlayerNotFound = -1;
const firstOpCode = 600;

const MessagesLogic: { [opCode: number]: (message: nkruntime.MatchMessage, state: GameState, dispatcher: nkruntime.MatchDispatcher, logger: nkruntime.Logger) => void } =
    {
        [OperationCode.RegisterOpCode]: registerOpCode,
        [OperationCode.GameState]: getGameState,
        [OperationCode.MessageDataState]: getMessageDataState,
    }
