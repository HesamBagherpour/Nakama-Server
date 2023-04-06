interface MatchLabel
{
    open: boolean,
    roomToken : string,
}
interface MatchLabelFilter
{
    roomToken: string
}

interface GameState
{
    players: Player[],
    opCodes :OpCode[],
    messageDataState :{[uuid: string]: string}
}

interface Player
{
    presence: nkruntime.Presence
    displayName: string
    avatarId: string
}
interface OpCode
{
    opCode: number
    key: string
}
interface MatchMessageData
{
    message: any
    state: MatchMessageDataState
}
interface MatchMessageDataState
{
    uuid: string
    state: any
}
interface MatchMessageDataState
{
    uuid: string
    state: any
}
