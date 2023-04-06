let matchInit: nkruntime.MatchInitFunction = function (context: nkruntime.Context, logger: nkruntime.Logger, nakama: nkruntime.Nakama, params: any) {
    logger.info("matchInit");
    logger.info("matchInit params: " + JSON.stringify(params));
    var matchLabelFilter: MatchLabelFilter = params.filter as MatchLabelFilter;
    var label: MatchLabel = {open: true, roomToken: matchLabelFilter.roomToken}

    var gameState: GameState =
        {
            players: [],
            opCodes: [],
            messageDataState: {}
        }
    return {
        state: gameState,
        tickRate: TickRate,
        label: JSON.stringify(label),
    }
}
let matchSignal: nkruntime.MatchSignalFunction = function (context: nkruntime.Context, logger: nkruntime.Logger, nakama: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, data: string) {
    logger.info("matchSignal");
    return {state};
}

let matchJoinAttempt: nkruntime.MatchJoinAttemptFunction = function (context: nkruntime.Context, logger: nkruntime.Logger, nakama: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presence: nkruntime.Presence, metadata: { [key: string]: any }) {
    logger.info("matchJoinAttempt");
    logger.info("matchJoinAttempt metadata: " + JSON.stringify(metadata));
    let gameState = state as GameState;

    //check close room and send accept false for new user

    return {
        state: gameState,
        accept: true,
    }
}

let matchJoin: nkruntime.MatchJoinFunction = function (context: nkruntime.Context, logger: nkruntime.Logger, nakama: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]) {
    logger.info("matchJoin");
    let gameState = state as GameState;

    let presencesOnMatch: nkruntime.Presence[] = [];
    gameState.players.forEach(player => {
        if (player != undefined) presencesOnMatch.push(player.presence);
    });
    for (let presence of presences) {
        var account: nkruntime.Account = nakama.accountGetId(presence.userId);
        let player: Player =
            {
                presence: presence,
                displayName: account.user.displayName,
                avatarId: account.user.avatarUrl
            }
        gameState.players.push(player);
        dispatcher.broadcastMessage(OperationCode.PlayerJoined, JSON.stringify(player), presencesOnMatch);
        presencesOnMatch.push(presence);
    }
    dispatcher.broadcastMessage(OperationCode.GameState, JSON.stringify(gameState), presences);
    return {state: gameState};
}

let matchLoop: nkruntime.MatchLoopFunction = function (context: nkruntime.Context, logger: nkruntime.Logger, nakama: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, messages: nkruntime.MatchMessage[]) {
    let gameState = state as GameState;
    processMessages(messages, gameState, dispatcher, logger);
    // check for end match and return null
    return {state: gameState};
}

let matchLeave: nkruntime.MatchLeaveFunction = function (context: nkruntime.Context, logger: nkruntime.Logger, nakama: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]) {
    let gameState = state as GameState;


    for (let presence of presences) {
        let playerNumber: number = getPlayerNumber(gameState.players, presence.sessionId);
        if (playerNumber != PlayerNotFound)
            gameState.players.splice(playerNumber, 1);
    }

    if (getPlayersCount(gameState.players) == 0)
        return null;

    return {state: gameState};
}

let matchTerminate: nkruntime.MatchTerminateFunction = function (context: nkruntime.Context, logger: nkruntime.Logger, nakama: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, graceSeconds: number) {
    return {state};
}

function processMessages(messages: nkruntime.MatchMessage[], gameState: GameState, dispatcher: nkruntime.MatchDispatcher, logger: nkruntime.Logger): void {
    for (let message of messages) {
        let opCode: number = message.opCode;
        if (MessagesLogic.hasOwnProperty(opCode))
            MessagesLogic[opCode](message, gameState, dispatcher, logger);
        else
            messagesDefaultLogic(message, gameState, dispatcher, logger);
    }
}

function messagesDefaultLogic(message: nkruntime.MatchMessage, gameState: GameState, dispatcher: nkruntime.MatchDispatcher, logger: nkruntime.Logger): void {
    // let matchMessageData: MatchMessageData = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(message.data)));
    // if(matchMessageData.state != null){
    //     gameState.messageDataState[matchMessageData.state.uuid] = matchMessageData.state.state;
    // }
    dispatcher.broadcastMessage(message.opCode, message.data, null, message.sender);
}

function getPlayerNumber(players: Player[], sessionId: string): number {
    for (let playerNumber = 0; playerNumber < players.length; playerNumber++)
        if (players[playerNumber] != undefined && players[playerNumber].presence.sessionId == sessionId)
            return playerNumber;

    return PlayerNotFound;
}

function getPlayersCount(players: Player[]): number {
    var count: number = 0;
    for (let playerNumber = 0; playerNumber < players.length; playerNumber++)
        if (players[playerNumber] != undefined)
            count++;
    return count;
}


function registerOpCode(message: nkruntime.MatchMessage, gameState: GameState, dispatcher: nkruntime.MatchDispatcher, logger: nkruntime.Logger): void {

    let data: OpCode = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(message.data)));

    let foundedOpCode: OpCode;
    gameState.opCodes.forEach(opcode => {
        if (opcode.key === data.key) {
            foundedOpCode = opcode;
        }
    });

    if (foundedOpCode == null) {
        foundedOpCode = {
            opCode: gameState.opCodes.length + 1 + firstOpCode,
            key: data.key
        };
        gameState.opCodes.push(foundedOpCode);
    }

    dispatcher.broadcastMessage(message.opCode, JSON.stringify(foundedOpCode), null, message.sender);
}

function getGameState(message: nkruntime.MatchMessage, gameState: GameState, dispatcher: nkruntime.MatchDispatcher, logger: nkruntime.Logger): void {
    dispatcher.broadcastMessage(message.opCode, JSON.stringify(gameState), null, message.sender);
}

function getMessageDataState(message: nkruntime.MatchMessage, gameState: GameState, dispatcher: nkruntime.MatchDispatcher, logger: nkruntime.Logger): void {
    let matchMessageData: MatchMessageData = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(message.data)));
    matchMessageData.state = {
        uuid: matchMessageData.state.uuid,
        state: gameState.messageDataState[matchMessageData.state.uuid]
    }
    dispatcher.broadcastMessage(message.opCode, JSON.stringify(matchMessageData), null, message.sender);
}


