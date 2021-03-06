(function() {
  var LispAtom, LispBuiltInFunction, LispBytecodeAssembler, LispEnvironment, LispEvaluator, LispFalse, LispInteger, LispList, LispNil, LispObject, LispString, LispSymbol, LispTrue, LispUserDefinedFunction, action, builtIns, className, isNode, params, root, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  isNode = false;

  if (typeof exports !== "undefined" && exports !== null) {
    _ref = require("./lisp-objects.js"), LispObject = _ref.LispObject, LispAtom = _ref.LispAtom, LispInteger = _ref.LispInteger, LispString = _ref.LispString, LispSymbol = _ref.LispSymbol, LispList = _ref.LispList, LispNil = _ref.LispNil, LispTrue = _ref.LispTrue, LispFalse = _ref.LispFalse, LispUserDefinedFunction = _ref.LispUserDefinedFunction, LispBytecodeAssembler = _ref.LispBytecodeAssembler;
    isNode = true;
  } else {
    LispObject = root.LispObject, LispAtom = root.LispAtom, LispInteger = root.LispInteger, LispString = root.LispString, LispSymbol = root.LispSymbol, LispList = root.LispList, LispNil = root.LispNil, LispTrue = root.LispTrue, LispFalse = root.LispFalse, LispUserDefinedFunction = root.LispUserDefinedFunction, LispBytecodeAssembler = root.LispBytecodeAssembler;
  }

  LispEvaluator = null;

  LispEnvironment = (function() {

    function LispEnvironment(parentEnv) {
      this.localBindings = [];
      this.parentEnv = parentEnv || null;
    }

    LispEnvironment.prototype.getBindingFor = function(symbol) {
      var binding, ret, _i, _len, _ref1;
      _ref1 = this.localBindings;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        binding = _ref1[_i];
        if (binding.key.equals(symbol)) {
          ret = binding;
        }
      }
      if (!ret && this.parentEnv) {
        return this.parentEnv.getBindingFor(symbol);
      }
      if (ret && ret.value) {
        return ret.value;
      } else {
        return null;
      }
    };

    LispEnvironment.prototype.addBindingFor = function(symbol, lispObject) {
      return this.localBindings.push({
        key: symbol,
        value: lispObject
      });
    };

    LispEnvironment.prototype.changeBindingFor = function(symbol, lispObject) {
      var binding, _i, _len, _ref1;
      _ref1 = this.localBindings;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        binding = _ref1[_i];
        if (binding.key.equals(symbol)) {
          binding.value = lispObject;
          return;
        }
      }
    };

    return LispEnvironment;

  })();

  root.LispEnvironment = LispEnvironment;

  LispBuiltInFunction = (function(_super) {

    __extends(LispBuiltInFunction, _super);

    function LispBuiltInFunction() {
      return LispBuiltInFunction.__super__.constructor.apply(this, arguments);
    }

    LispBuiltInFunction.prototype.isLispBuiltInFunction = true;

    LispBuiltInFunction.prototype.action = function() {};

    LispBuiltInFunction.prototype.toString = function() {
      return "((Builtin Function))";
    };

    return LispBuiltInFunction;

  })(LispAtom);

  root.LispBuiltInFunction = LispBuiltInFunction;

  builtIns = {
    "Plus": {
      symbol: "+",
      action: function(args, env) {
        var arg;
        arg = LispEvaluator["eval"](args.first, env);
        if (arg && !args.rest.isLispNil) {
          return new LispInteger(arg.value + (this.action(args.rest, env)).value);
        } else if (arg) {
          return new LispInteger(arg.value);
        } else {
          return new LispInteger(0);
        }
      }
    },
    "Minus": {
      symbol: "-",
      action: function(args, env) {
        var arg;
        arg = LispEvaluator["eval"](args.first, env);
        if (arg && !args.rest.isLispNil) {
          return new LispInteger(arg.value - (this.action(args.rest, env)).value);
        } else if (arg) {
          return new LispInteger(arg.value);
        } else {
          return new LispInteger(0);
        }
      }
    },
    "Multiply": {
      symbol: "*",
      action: function(args, env) {
        var arg;
        arg = LispEvaluator["eval"](args.first, env);
        if (arg && !args.rest.isLispNil) {
          return new LispInteger(arg.value * (this.action(args.rest, env)).value);
        } else if (arg) {
          return new LispInteger(arg.value);
        } else {
          return new LispInteger(0);
        }
      }
    },
    "Divide": {
      symbol: "/",
      action: function(args, env) {
        var arg;
        arg = LispEvaluator["eval"](args.first, env);
        if (arg && !args.rest.isLispNil) {
          return new LispInteger(arg.value / (this.action(args.rest, env)).value);
        } else if (arg) {
          return new LispInteger(arg.value);
        } else {
          return new LispInteger(0);
        }
      }
    },
    "Define": {
      symbol: "define",
      action: function(args, env) {
        var bodyList, definedBinding, func, funcName, unevaluatedArgs, value, varNameOrFunc;
        varNameOrFunc = args.first;
        if (varNameOrFunc.isLispSymbol) {
          definedBinding = env.getBindingFor(varNameOrFunc);
          if (definedBinding !== null) {
            return definedBinding;
          }
          value = LispEvaluator["eval"](args.rest.first, env);
          env.addBindingFor(varNameOrFunc, value);
          return value;
        } else if (varNameOrFunc.isLispList) {
          funcName = varNameOrFunc.first;
          unevaluatedArgs = varNameOrFunc.rest;
          bodyList = args.rest;
          func = new LispUserDefinedFunction(unevaluatedArgs, bodyList, env);
          env.addBindingFor(funcName, func);
          return func;
        }
        return new LispNil();
      }
    },
    "Set": {
      symbol: "set!",
      action: function(args, env) {
        var definedBinding, value, varName;
        varName = args.first;
        value = LispEvaluator["eval"](args.rest.first, env);
        if (varName.isLispSymbol) {
          definedBinding = env.getBindingFor(varName);
          if (definedBinding === null) {
            throw "" + varName + " is not defined and cannot be set to " + value;
          }
          env.changeBindingFor(varName, value);
          return value;
        }
        return new LispNil();
      }
    },
    "Let": {
      symbol: "let",
      action: function(args, env) {
        var bodies, currentPair, evaluate, key, keyValueList, tempEnv, value;
        keyValueList = args.first;
        currentPair = keyValueList.first;
        bodies = args.rest;
        tempEnv = new LispEnvironment(env);
        while (!keyValueList.isLispNil) {
          key = currentPair.first;
          value = currentPair.second();
          evaluate = new LispList(new LispSymbol("define"), new LispList(key, new LispList(value, new LispNil())));
          LispEvaluator["eval"](evaluate, tempEnv);
          keyValueList = keyValueList.rest;
          currentPair = keyValueList.first;
        }
        evaluate = new LispList(new LispSymbol("begin"), bodies);
        return LispEvaluator["eval"](evaluate, tempEnv);
      }
    },
    "Lambda": {
      symbol: "lambda",
      action: function(args, env) {
        var bodyList, unevaluatedArgs;
        unevaluatedArgs = args.first;
        bodyList = args.rest;
        return new LispUserDefinedFunction(unevaluatedArgs, bodyList, env);
      }
    },
    "SetBytecode": {
      symbol: "set-bytecode!",
      action: function(args, env) {
        var bytecode, func;
        func = LispEvaluator["eval"](args.first, env);
        bytecode = LispEvaluator["eval"](args.second(), env);
        console.log(func, args.first);
        console.log(bytecode, args.second());
        return func.bytecode = bytecode;
      }
    },
    "SetLiterals": {
      symbol: "set-literals!",
      action: function(args, env) {
        var func, literals;
        func = LispEvaluator["eval"](args.first, env);
        literals = LispEvaluator["eval"](args.second(), env);
        return func.literals = literals;
      }
    },
    "GetBody": {
      symbol: "get-body",
      action: function(args, env) {
        var func;
        func = LispEvaluator["eval"](args.first, env);
        return func.bodyList;
      }
    },
    "GetArgList": {
      symbol: "get-argList",
      action: function(args, env) {
        var func;
        func = LispEvaluator["eval"](args.first, env);
        return func.args;
      }
    },
    "Begin": {
      symbol: "begin",
      action: function(args, env) {
        var restList, result;
        result = new LispNil();
        restList = args;
        while (!restList.isLispNil) {
          result = LispEvaluator["eval"](restList.first, env);
          restList = restList.rest;
        }
        return result;
      }
    },
    "If": {
      symbol: "if",
      action: function(args, env) {
        var cond, unevaluatedCond, unevaluatedElseBody, unevaluatedIfBody;
        unevaluatedCond = args.first;
        unevaluatedIfBody = args.second();
        unevaluatedElseBody = args.third();
        cond = LispEvaluator["eval"](unevaluatedCond, env);
        if (cond != null ? cond.isLispTrue : void 0) {
          return LispEvaluator["eval"](unevaluatedIfBody, env);
        } else {
          return LispEvaluator["eval"](unevaluatedElseBody, env);
        }
      }
    },
    "Eq": {
      symbol: "eq?",
      action: function(args, env) {
        var A, B, comp, unevaluatedA, unevaluatedB;
        unevaluatedA = args.first;
        unevaluatedB = args.second();
        A = LispEvaluator["eval"](unevaluatedA, env);
        B = LispEvaluator["eval"](unevaluatedB, env);
        comp = function(a, b) {
          if ((a.isLispSymbol && b.isLispSymbol) || (a.isLispString && b.isLispString)) {
            return a.characters === b.characters;
          } else if (a.isLispAtom && b.isLispAtom) {
            return a.value === b.value;
          } else if (a.isLispList && b.isLispList) {
            return comp(a.first, b.first) && comp(a.rest, b.rest);
          } else {
            return a === b;
          }
        };
        return (comp(A, B) ? new LispTrue() : new LispFalse());
      }
    },
    "IsCons": {
      symbol: "cons?",
      action: function(args, env) {
        var testObj;
        testObj = LispEvaluator["eval"](args.first, env);
        if (testObj.isLispList) {
          return new LispTrue();
        } else {
          return new LispFalse();
        }
      }
    },
    "IsSymbol": {
      symbol: "symbol?",
      action: function(args, env) {
        var testObj;
        testObj = LispEvaluator["eval"](args.first, env);
        if (testObj.isLispSymbol) {
          return new LispTrue();
        } else {
          return new LispFalse();
        }
      }
    },
    "IsNumber": {
      symbol: "number?",
      action: function(args, env) {
        var testObj;
        testObj = LispEvaluator["eval"](args.first, env);
        if (testObj.isLispInteger) {
          return new LispTrue();
        } else {
          return new LispFalse();
        }
      }
    },
    "And": {
      symbol: "and",
      action: function(args, env) {
        var condA, condB, unevaluatedCondA, unevaluatedCondB;
        unevaluatedCondA = args.first;
        unevaluatedCondB = args.second();
        condA = LispEvaluator["eval"](unevaluatedCondA, env);
        condB = LispEvaluator["eval"](unevaluatedCondB, env);
        if ((condA != null ? condA.isLispTrue : void 0) && (condB != null ? condB.isLispTrue : void 0)) {
          return new LispTrue();
        }
        return new LispFalse();
      }
    },
    "Or": {
      symbol: "or",
      action: function(args, env) {
        var condA, condB, unevaluatedCondA, unevaluatedCondB;
        unevaluatedCondA = args.first;
        unevaluatedCondB = args.second();
        condA = LispEvaluator["eval"](unevaluatedCondA, env);
        condB = LispEvaluator["eval"](unevaluatedCondB, env);
        if ((condA != null ? condA.isLispTrue : void 0) || (condB != null ? condB.isLispTrue : void 0)) {
          return new LispTrue();
        }
        return new LispFalse();
      }
    },
    "Not": {
      symbol: "not",
      action: function(args, env) {
        var cond, unevaluatedCond;
        unevaluatedCond = args.first;
        cond = LispEvaluator["eval"](unevaluatedCond, env);
        if (cond != null ? cond.isLispTrue : void 0) {
          return new LispFalse();
        }
        return new LispTrue();
      }
    },
    "Cons": {
      symbol: "cons",
      action: function(args, env) {
        var unevaluatedFirst, unevaluatedSecond;
        unevaluatedFirst = args.first;
        unevaluatedSecond = args.second();
        return new LispList(LispEvaluator["eval"](unevaluatedFirst, env), LispEvaluator["eval"](unevaluatedSecond, env));
      }
    },
    "First": {
      symbol: "first",
      action: function(args, env) {
        var list;
        list = LispEvaluator["eval"](args.first, env);
        return list.first;
      }
    },
    "Rest": {
      symbol: "rest",
      action: function(args, env) {
        var list;
        list = LispEvaluator["eval"](args.first, env);
        return list.rest;
      }
    },
    "Second": {
      symbol: "second",
      action: function(args, env) {
        var list;
        list = LispEvaluator["eval"](args.first, env);
        if (list != null ? list.rest.isLispList : void 0) {
          return list.rest.first;
        } else {
          return new LispNil();
        }
      }
    },
    "Third": {
      symbol: "third",
      action: function(args, env) {
        var list;
        list = LispEvaluator["eval"](args.first, env);
        if (list != null ? list.rest.isLispList : void 0) {
          if (list.rest.rest.isLispList) {
            return list.rest.rest.first;
          } else {
            return new LispNil();
          }
        } else {
          return new LispNil();
        }
      }
    },
    "Reverse": {
      symbol: "reverse",
      action: function(args, env) {
        var doReverse, list;
        list = LispEvaluator["eval"](args.first, env);
        doReverse = function(list, append) {
          if (list.isLispNil) {
            return append;
          } else {
            return doReverse(list.rest, new LispList(list.first, append));
          }
        };
        return doReverse(list, new LispNil());
      }
    },
    "Quote": {
      symbol: "quote",
      action: function(args, env) {
        return args.first;
      }
    },
    "Error": {
      symbol: "error",
      action: function(args, env) {
        var msg;
        msg = LispEvaluator["eval"](args.first, env);
        throw "" + msg.characters;
      }
    },
    "Print": {
      symbol: "print",
      action: function(args, env) {
        var msg, output;
        msg = LispEvaluator["eval"](args.first, env);
        output = isNode ? console.log : root.LispReader.print;
        if (msg.isLispString) {
          output("" + msg.characters);
        } else {
          output("" + (msg.toString()));
        }
        return msg;
      }
    }
  };

  for (className in builtIns) {
    params = builtIns[className];
    action = params.action;
    root["LispBuiltIn" + className + "Function"] = (function(_super) {

      __extends(_Class, _super);

      function _Class() {
        return _Class.__super__.constructor.apply(this, arguments);
      }

      _Class.prototype.action = (function(className, action) {
        return function() {
          if (!LispEvaluator) {
            if (isNode) {
              LispEvaluator = require("./lispevaluator.js").LispEvaluator;
            }
            if (!isNode) {
              LispEvaluator = root.LispEvaluator;
            }
          }
          return action.apply(this, arguments);
        };
      })(className, action);

      return _Class;

    })(LispBuiltInFunction);
  }

}).call(this);
