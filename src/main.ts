const JoinOrCreateMatchRpc = "JoinOrCreateMatchRpc";
const MatchModuleName = "match";

let InitModule: nkruntime.InitModule =
    function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer)
{
    logger.info("_______________*******************_____________________");
    initializer.registerRpc(JoinOrCreateMatchRpc, joinOrCreateMatch);
    initializer.registerMatch(MatchModuleName, {
        matchInit,
        matchJoinAttempt,
        matchJoin,
        matchLeave,
        matchLoop,
        matchTerminate,
        matchSignal
    });

    // logger.info(LogicLoadedLoggerInfo);
}

