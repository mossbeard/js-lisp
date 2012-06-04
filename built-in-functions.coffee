
root = exports ? this

##
# Built-In Funktionen
##
class LispBuiltInFunction extends LispAtom
    isLispBuiltInFunction: true
    action: ->

    toString: ->
        "((Builtin Function))"
        
root.LispBuiltInFunction = LispBuiltInFunction

builtIns =
    ##
    # +
    ##
    "Plus": (args, env) ->
        arg = LispEvaluator.eval(args.first, env)
        if arg and not args.rest.isLispNil
            new LispInteger(arg + (@action(args.rest, env)).value)
        else if arg
            new LispInteger(arg)
        else
            new LispInteger(0)
    
    ##
    # -
    ##
    "Minus": (args, env) ->
        arg = LispEvaluator.eval(args.first, env)
        if arg and not args.rest.isLispNil
            new LispInteger(arg - (@action(args.rest, env)).value)
        else if arg
            new LispInteger(arg)
        else
            new LispInteger(0)
    
    ##
    # *
    ##
    "Multiply": (args, env) ->
        arg = LispEvaluator.eval(args.first, env)
        if arg and not args.rest.isLispNil
            new LispInteger(arg * (@action(args.rest, env)).value)
        else if arg
            new LispInteger(arg)
        else
            new LispInteger(0)
    
    ##
    # /
    ##
    "Divide": (args, env) ->
        arg = LispEvaluator.eval(args.first, env)
        if arg and not args.rest.isLispNil
            new LispInteger(arg / (@action(args.rest, env)).value)
        else if arg
            new LispInteger(arg)
        else
            new LispInteger(0)
    
    ##
    # define
    ##
    "Define": (args, env) ->
        varNameOrFunc = args.first

        if varNameOrFunc.isLispSymbol
            # Bindings, die es schon gibt, werden nicht überschrieben!
            definedBinding = env.getBindingFor varNameOrFunc
            return definedBinding if not definedBinding.isLispNil
            
            value = LispEvaluator.eval(args.rest.first, env)
            env.addBindingFor varNameOrFunc, value
            return value

        # Syntactic Sugar für einfachere lambdas
        else if varNameOrFunc.isLispList
            funcName = varNameOrFunc.first
            unevaluatedArgs = varNameOrFunc.rest
            bodyList = args.rest
            func = new LispUserDefinedFunction(unevaluatedArgs, bodyList, env)
            env.addBindingFor funcName, func
            return func
        new LispNil()
    
    ##
    # set!
    ##
    "Set": (args, env) ->
        varName = args.first
        value = LispEvaluator.eval(args.rest.first, env)

        if varName.isLispSymbol
            definedBinding = env.getBindingFor varName
            throw "#{varName} is not defined and cannot be set to #{value}" if definedBinding.isLispNil
            
            env.changeBindingFor varName, value
            return value

        new LispNil()
    
    ##
    # let
    ##
    "Let": (args, env) ->
        keyValueList = args.first
        currentPair = keyValueList.first
        bodies = args.rest
        tempEnv = new LispEnvironment(env);
        
        until keyValueList.isLispNil
            key = currentPair.first
            value = currentPair.second()
            evaluate = new LispList(new LispSymbol("define"), new LispList(key, new LispList(value, new LispNil())))
            # lass die "define" Funktion ihren Job machen
            LispEvaluator.eval(evaluate, tempEnv)
            keyValueList = keyValueList.rest
            currentPair = keyValueList.first
            
        evaluate = new LispList(new LispSymbol("begin"), bodies);
        LispEvaluator.eval(evaluate, tempEnv)
    
    ##
    # lambda
    ##
    "Lambda": (args, env) ->
        unevaluatedArgs = args.first
        bodyList = args.rest
        new LispUserDefinedFunction(unevaluatedArgs, bodyList, env)
    
    ##
    # begin
    ##
    "Begin": (args, env) ->
        result = new LispNil()
        restList = args
        until restList.isLispNil
            result = LispEvaluator.eval restList.first, env
            restList = restList.rest
        result
    
    ##
    # if
    ##
    "If": (args, env) ->
        unevaluatedCond = args.first
        unevaluatedIfBody = args.second()
        unevaluatedElseBody = args.third()
        cond = LispEvaluator.eval(unevaluatedCond, env)
        if cond and cond.isLispTrue
            LispEvaluator.eval(unevaluatedIfBody, env)
        else 
            LispEvaluator.eval(unevaluatedElseBody, env)
    
    ##
    # eq?
    ##
    "Eq": (args, env) ->
        unevaluatedA = args.first
        unevaluatedB = args.second()
        A = LispEvaluator.eval(unevaluatedA, env)
        B = LispEvaluator.eval(unevaluatedB, env)
        
        comp = (a, b) ->
            if (a.isLispSymbol and b.isLispSymbol) or (a.isLispString and b.isLispString)
                a.characters is b.characters
            else if a.isLispAtom and b.isLispAtom
                a.value is b.value
            else if a.isLispList and b.isLispList
                comp(a.first, b.first) and comp(a.rest, b.rest)
            else
                a is b

        return (if comp A, B then new LispTrue() else new LispFalse())
    
    ##
    # and
    ##
    "And": (args, env) ->
        unevaluatedCondA = args.first
        unevaluatedCondB = args.second()
        
        condA = LispEvaluator.eval(unevaluatedCondA, env)
        condB = LispEvaluator.eval(unevaluatedCondB, env)
        
        if condA?.isLispTrue and condB?.isLispTrue
            return new LispTrue()
        new LispFalse()
    
    ##
    # or
    ##
    "Or": (args, env) ->
        unevaluatedCondA = args.first
        unevaluatedCondB = args.second()
        
        condA = LispEvaluator.eval(unevaluatedCondA, env)
        condB = LispEvaluator.eval(unevaluatedCondB, env)
        
        if condA?.isLispTrue or condB?.isLispTrue
            return new LispTrue()
        new LispFalse()
    
    ##
    # not
    ##
    "Not": (args, env) ->
        unevaluatedCond = args.first
        
        cond = LispEvaluator.eval(unevaluatedCond, env)
        
        if cond?.isLispTrue
            return new LispFalse()
        new LispTrue()
    
    ##
    # cons
    ##
    "Cons": (args, env) ->
        unevaluatedFirst = args.first
        unevaluatedSecond = args.second()
        new LispList(LispEvaluator.eval(unevaluatedFirst, env), LispEvaluator.eval(unevaluatedSecond, env))
    
    ##
    # first
    ##
    "First": (args, env) ->
        list = LispEvaluator.eval(args.first, env)
        list.first
    
    ##
    # rest
    ##
    "Rest": (args, env) ->
        list = LispEvaluator.eval(args.first, env)
        list.rest
    
    ##
    # quote
    # Evaluiert die Parameter nicht, sondern gibt sie einfach zurück
    ##
    "Quote": (args, env) ->
        args.first
    
    ##
    # error
    # Gibt eine Fehlermeldung aus
    ##
    "Error": (args, env) ->
        msg = LispEvaluator.eval(args.first, env)
        throw "#{msg.characters}"
    
# erzeuge die Klassen
for className, action of builtIns
    class root["LispBuiltIn#{className}Function"] extends LispBuiltInFunction
        action: action
