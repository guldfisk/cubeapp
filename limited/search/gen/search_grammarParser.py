# Generated from /home/phdk/PycharmProjects/cubeapp/limited/search/search_grammar.g4 by ANTLR 4.9.1
# encoding: utf-8
import sys
from io import StringIO

from antlr4 import *


if sys.version_info[1] > 5:
    from typing import TextIO
else:
    from typing.io import TextIO


def serializedATN():
    with StringIO() as buf:
        buf.write("\3\u608b\ua72a\u8133\ub9ed\u417c\u3be7\u7786\u5964\3\30")
        buf.write("W\4\2\t\2\4\3\t\3\4\4\t\4\4\5\t\5\4\6\t\6\4\7\t\7\3\2")
        buf.write("\3\2\3\2\3\3\3\3\3\3\3\3\3\3\3\3\3\3\3\3\5\3\32\n\3\3")
        buf.write("\3\3\3\3\3\3\3\3\3\3\3\3\3\3\3\7\3$\n\3\f\3\16\3'\13")
        buf.write("\3\3\4\3\4\3\4\3\4\3\4\3\4\3\4\3\4\3\4\3\4\3\4\3\4\3\4")
        buf.write("\3\4\3\4\3\4\3\4\3\4\3\4\3\4\3\4\3\4\3\4\3\4\3\4\3\4\3")
        buf.write("\4\3\4\5\4E\n\4\3\5\3\5\3\5\5\5J\n\5\3\6\3\6\5\6N\n\6")
        buf.write("\3\7\3\7\3\7\3\7\3\7\5\7U\n\7\3\7\2\3\4\b\2\4\6\b\n\f")
        buf.write("\2\2\2c\2\16\3\2\2\2\4\31\3\2\2\2\6D\3\2\2\2\bI\3\2\2")
        buf.write("\2\nM\3\2\2\2\fT\3\2\2\2\16\17\5\4\3\2\17\20\7\2\2\3\20")
        buf.write("\3\3\2\2\2\21\22\b\3\1\2\22\23\7\3\2\2\23\32\5\4\3\b\24")
        buf.write("\25\7\4\2\2\25\26\5\4\3\2\26\27\7\5\2\2\27\32\3\2\2\2")
        buf.write("\30\32\5\6\4\2\31\21\3\2\2\2\31\24\3\2\2\2\31\30\3\2\2")
        buf.write("\2\32%\3\2\2\2\33\34\f\5\2\2\34$\5\4\3\6\35\36\f\4\2\2")
        buf.write('\36\37\7\6\2\2\37$\5\4\3\5 !\f\3\2\2!"\7\7\2\2"$\5\4')
        buf.write("\3\4#\33\3\2\2\2#\35\3\2\2\2# \3\2\2\2$'\3\2\2\2%#\3")
        buf.write("\2\2\2%&\3\2\2\2&\5\3\2\2\2'%\3\2\2\2(E\5\b\5\2)*\7\16")
        buf.write("\2\2*+\7\b\2\2+E\5\b\5\2,-\7\17\2\2-.\5\n\6\2./\5\b\5")
        buf.write("\2/E\3\2\2\2\60\61\7\20\2\2\61\62\5\n\6\2\62\63\5\b\5")
        buf.write("\2\63E\3\2\2\2\64\65\7\21\2\2\65\66\5\f\7\2\66\67\7\25")
        buf.write("\2\2\67E\3\2\2\289\7\22\2\29:\5\f\7\2:;\7\25\2\2;E\3\2")
        buf.write("\2\2<=\7\23\2\2=>\5\f\7\2>?\7\25\2\2?E\3\2\2\2@A\7\24")
        buf.write("\2\2AB\5\n\6\2BC\5\b\5\2CE\3\2\2\2D(\3\2\2\2D)\3\2\2\2")
        buf.write("D,\3\2\2\2D\60\3\2\2\2D\64\3\2\2\2D8\3\2\2\2D<\3\2\2\2")
        buf.write("D@\3\2\2\2E\7\3\2\2\2FJ\7\27\2\2GJ\7\26\2\2HJ\7\25\2\2")
        buf.write("IF\3\2\2\2IG\3\2\2\2IH\3\2\2\2J\t\3\2\2\2KN\7\t\2\2LN")
        buf.write("\7\b\2\2MK\3\2\2\2ML\3\2\2\2N\13\3\2\2\2OU\7\t\2\2PU\7")
        buf.write("\n\2\2QU\7\13\2\2RU\7\f\2\2SU\7\r\2\2TO\3\2\2\2TP\3\2")
        buf.write("\2\2TQ\3\2\2\2TR\3\2\2\2TS\3\2\2\2U\r\3\2\2\2\t\31#%D")
        buf.write("IMT")
        return buf.getvalue()


class search_grammarParser(Parser):
    grammarFileName = "search_grammar.g4"

    atn = ATNDeserializer().deserialize(serializedATN())

    decisionsToDFA = [DFA(ds, i) for i, ds in enumerate(atn.decisionToState)]

    sharedContextCache = PredictionContextCache()

    literalNames = ["<INVALID>", "'!'", "'('", "')'", "'&'", "'||'", "':'", "'='", "'<'", "'<='", "'>'", "'>='"]

    symbolicNames = [
        "<INVALID>",
        "<INVALID>",
        "<INVALID>",
        "<INVALID>",
        "<INVALID>",
        "<INVALID>",
        "<INVALID>",
        "<INVALID>",
        "<INVALID>",
        "<INVALID>",
        "<INVALID>",
        "<INVALID>",
        "PRINTING_CODE",
        "NAME_CODE",
        "CREATOR_CODE",
        "WINS_CODE",
        "LOSSES_CODE",
        "DRAWS_CODE",
        "CUBE_CODE",
        "UNSIGNED_INTEGER",
        "QUOTED_VALUE",
        "VALUE",
        "WHITESPACE",
    ]

    RULE_start = 0
    RULE_operation = 1
    RULE_restriction = 2
    RULE_value = 3
    RULE_subset_operator = 4
    RULE_comparison_operator = 5

    ruleNames = ["start", "operation", "restriction", "value", "subset_operator", "comparison_operator"]

    EOF = Token.EOF
    T__0 = 1
    T__1 = 2
    T__2 = 3
    T__3 = 4
    T__4 = 5
    T__5 = 6
    T__6 = 7
    T__7 = 8
    T__8 = 9
    T__9 = 10
    T__10 = 11
    PRINTING_CODE = 12
    NAME_CODE = 13
    CREATOR_CODE = 14
    WINS_CODE = 15
    LOSSES_CODE = 16
    DRAWS_CODE = 17
    CUBE_CODE = 18
    UNSIGNED_INTEGER = 19
    QUOTED_VALUE = 20
    VALUE = 21
    WHITESPACE = 22

    def __init__(self, input: TokenStream, output: TextIO = sys.stdout):
        super().__init__(input, output)
        self.checkVersion("4.9.1")
        self._interp = ParserATNSimulator(self, self.atn, self.decisionsToDFA, self.sharedContextCache)
        self._predicates = None

    class StartContext(ParserRuleContext):
        __slots__ = "parser"

        def __init__(self, parser, parent: ParserRuleContext = None, invokingState: int = -1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def operation(self):
            return self.getTypedRuleContext(search_grammarParser.OperationContext, 0)

        def EOF(self):
            return self.getToken(search_grammarParser.EOF, 0)

        def getRuleIndex(self):
            return search_grammarParser.RULE_start

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterStart"):
                listener.enterStart(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitStart"):
                listener.exitStart(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitStart"):
                return visitor.visitStart(self)
            else:
                return visitor.visitChildren(self)

    def start(self):
        localctx = search_grammarParser.StartContext(self, self._ctx, self.state)
        self.enterRule(localctx, 0, self.RULE_start)
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 12
            self.operation(0)
            self.state = 13
            self.match(search_grammarParser.EOF)
        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx

    class OperationContext(ParserRuleContext):
        __slots__ = "parser"

        def __init__(self, parser, parent: ParserRuleContext = None, invokingState: int = -1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def getRuleIndex(self):
            return search_grammarParser.RULE_operation

        def copyFrom(self, ctx: ParserRuleContext):
            super().copyFrom(ctx)

    class NotContext(OperationContext):
        def __init__(self, parser, ctx: ParserRuleContext):  # actually a search_grammarParser.OperationContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def operation(self):
            return self.getTypedRuleContext(search_grammarParser.OperationContext, 0)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterNot"):
                listener.enterNot(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitNot"):
                listener.exitNot(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitNot"):
                return visitor.visitNot(self)
            else:
                return visitor.visitChildren(self)

    class ParenthesisContext(OperationContext):
        def __init__(self, parser, ctx: ParserRuleContext):  # actually a search_grammarParser.OperationContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def operation(self):
            return self.getTypedRuleContext(search_grammarParser.OperationContext, 0)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterParenthesis"):
                listener.enterParenthesis(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitParenthesis"):
                listener.exitParenthesis(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitParenthesis"):
                return visitor.visitParenthesis(self)
            else:
                return visitor.visitChildren(self)

    class RestrictionOperationContext(OperationContext):
        def __init__(self, parser, ctx: ParserRuleContext):  # actually a search_grammarParser.OperationContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def restriction(self):
            return self.getTypedRuleContext(search_grammarParser.RestrictionContext, 0)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterRestrictionOperation"):
                listener.enterRestrictionOperation(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitRestrictionOperation"):
                listener.exitRestrictionOperation(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitRestrictionOperation"):
                return visitor.visitRestrictionOperation(self)
            else:
                return visitor.visitChildren(self)

    class OrContext(OperationContext):
        def __init__(self, parser, ctx: ParserRuleContext):  # actually a search_grammarParser.OperationContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def operation(self, i: int = None):
            if i is None:
                return self.getTypedRuleContexts(search_grammarParser.OperationContext)
            else:
                return self.getTypedRuleContext(search_grammarParser.OperationContext, i)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterOr"):
                listener.enterOr(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitOr"):
                listener.exitOr(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitOr"):
                return visitor.visitOr(self)
            else:
                return visitor.visitChildren(self)

    class AndContext(OperationContext):
        def __init__(self, parser, ctx: ParserRuleContext):  # actually a search_grammarParser.OperationContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def operation(self, i: int = None):
            if i is None:
                return self.getTypedRuleContexts(search_grammarParser.OperationContext)
            else:
                return self.getTypedRuleContext(search_grammarParser.OperationContext, i)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterAnd"):
                listener.enterAnd(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitAnd"):
                listener.exitAnd(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitAnd"):
                return visitor.visitAnd(self)
            else:
                return visitor.visitChildren(self)

    def operation(self, _p: int = 0):
        _parentctx = self._ctx
        _parentState = self.state
        localctx = search_grammarParser.OperationContext(self, self._ctx, _parentState)
        _prevctx = localctx
        _startState = 2
        self.enterRecursionRule(localctx, 2, self.RULE_operation, _p)
        try:
            self.enterOuterAlt(localctx, 1)
            self.state = 23
            self._errHandler.sync(self)
            token = self._input.LA(1)
            if token in [search_grammarParser.T__0]:
                localctx = search_grammarParser.NotContext(self, localctx)
                self._ctx = localctx
                _prevctx = localctx

                self.state = 16
                self.match(search_grammarParser.T__0)
                self.state = 17
                self.operation(6)
                pass
            elif token in [search_grammarParser.T__1]:
                localctx = search_grammarParser.ParenthesisContext(self, localctx)
                self._ctx = localctx
                _prevctx = localctx
                self.state = 18
                self.match(search_grammarParser.T__1)
                self.state = 19
                self.operation(0)
                self.state = 20
                self.match(search_grammarParser.T__2)
                pass
            elif token in [
                search_grammarParser.PRINTING_CODE,
                search_grammarParser.NAME_CODE,
                search_grammarParser.CREATOR_CODE,
                search_grammarParser.WINS_CODE,
                search_grammarParser.LOSSES_CODE,
                search_grammarParser.DRAWS_CODE,
                search_grammarParser.CUBE_CODE,
                search_grammarParser.UNSIGNED_INTEGER,
                search_grammarParser.QUOTED_VALUE,
                search_grammarParser.VALUE,
            ]:
                localctx = search_grammarParser.RestrictionOperationContext(self, localctx)
                self._ctx = localctx
                _prevctx = localctx
                self.state = 22
                self.restriction()
                pass
            else:
                raise NoViableAltException(self)

            self._ctx.stop = self._input.LT(-1)
            self.state = 35
            self._errHandler.sync(self)
            _alt = self._interp.adaptivePredict(self._input, 2, self._ctx)
            while _alt != 2 and _alt != ATN.INVALID_ALT_NUMBER:
                if _alt == 1:
                    if self._parseListeners is not None:
                        self.triggerExitRuleEvent()
                    _prevctx = localctx
                    self.state = 33
                    self._errHandler.sync(self)
                    la_ = self._interp.adaptivePredict(self._input, 1, self._ctx)
                    if la_ == 1:
                        localctx = search_grammarParser.AndContext(
                            self, search_grammarParser.OperationContext(self, _parentctx, _parentState)
                        )
                        self.pushNewRecursionContext(localctx, _startState, self.RULE_operation)
                        self.state = 25
                        if not self.precpred(self._ctx, 3):
                            from antlr4.error.Errors import FailedPredicateException

                            raise FailedPredicateException(self, "self.precpred(self._ctx, 3)")
                        self.state = 26
                        self.operation(4)
                        pass

                    elif la_ == 2:
                        localctx = search_grammarParser.AndContext(
                            self, search_grammarParser.OperationContext(self, _parentctx, _parentState)
                        )
                        self.pushNewRecursionContext(localctx, _startState, self.RULE_operation)
                        self.state = 27
                        if not self.precpred(self._ctx, 2):
                            from antlr4.error.Errors import FailedPredicateException

                            raise FailedPredicateException(self, "self.precpred(self._ctx, 2)")
                        self.state = 28
                        self.match(search_grammarParser.T__3)
                        self.state = 29
                        self.operation(3)
                        pass

                    elif la_ == 3:
                        localctx = search_grammarParser.OrContext(
                            self, search_grammarParser.OperationContext(self, _parentctx, _parentState)
                        )
                        self.pushNewRecursionContext(localctx, _startState, self.RULE_operation)
                        self.state = 30
                        if not self.precpred(self._ctx, 1):
                            from antlr4.error.Errors import FailedPredicateException

                            raise FailedPredicateException(self, "self.precpred(self._ctx, 1)")
                        self.state = 31
                        self.match(search_grammarParser.T__4)
                        self.state = 32
                        self.operation(2)
                        pass

                self.state = 37
                self._errHandler.sync(self)
                _alt = self._interp.adaptivePredict(self._input, 2, self._ctx)

        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.unrollRecursionContexts(_parentctx)
        return localctx

    class RestrictionContext(ParserRuleContext):
        __slots__ = "parser"

        def __init__(self, parser, parent: ParserRuleContext = None, invokingState: int = -1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def getRuleIndex(self):
            return search_grammarParser.RULE_restriction

        def copyFrom(self, ctx: ParserRuleContext):
            super().copyFrom(ctx)

    class NameRestrictionContext(RestrictionContext):
        def __init__(self, parser, ctx: ParserRuleContext):  # actually a search_grammarParser.RestrictionContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def NAME_CODE(self):
            return self.getToken(search_grammarParser.NAME_CODE, 0)

        def subset_operator(self):
            return self.getTypedRuleContext(search_grammarParser.Subset_operatorContext, 0)

        def value(self):
            return self.getTypedRuleContext(search_grammarParser.ValueContext, 0)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterNameRestriction"):
                listener.enterNameRestriction(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitNameRestriction"):
                listener.exitNameRestriction(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitNameRestriction"):
                return visitor.visitNameRestriction(self)
            else:
                return visitor.visitChildren(self)

    class LossesRestrictionContext(RestrictionContext):
        def __init__(self, parser, ctx: ParserRuleContext):  # actually a search_grammarParser.RestrictionContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def LOSSES_CODE(self):
            return self.getToken(search_grammarParser.LOSSES_CODE, 0)

        def comparison_operator(self):
            return self.getTypedRuleContext(search_grammarParser.Comparison_operatorContext, 0)

        def UNSIGNED_INTEGER(self):
            return self.getToken(search_grammarParser.UNSIGNED_INTEGER, 0)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterLossesRestriction"):
                listener.enterLossesRestriction(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitLossesRestriction"):
                listener.exitLossesRestriction(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitLossesRestriction"):
                return visitor.visitLossesRestriction(self)
            else:
                return visitor.visitChildren(self)

    class CubeRestrictionContext(RestrictionContext):
        def __init__(self, parser, ctx: ParserRuleContext):  # actually a search_grammarParser.RestrictionContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def CUBE_CODE(self):
            return self.getToken(search_grammarParser.CUBE_CODE, 0)

        def subset_operator(self):
            return self.getTypedRuleContext(search_grammarParser.Subset_operatorContext, 0)

        def value(self):
            return self.getTypedRuleContext(search_grammarParser.ValueContext, 0)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterCubeRestriction"):
                listener.enterCubeRestriction(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitCubeRestriction"):
                listener.exitCubeRestriction(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitCubeRestriction"):
                return visitor.visitCubeRestriction(self)
            else:
                return visitor.visitChildren(self)

    class WinsRestrictionContext(RestrictionContext):
        def __init__(self, parser, ctx: ParserRuleContext):  # actually a search_grammarParser.RestrictionContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def WINS_CODE(self):
            return self.getToken(search_grammarParser.WINS_CODE, 0)

        def comparison_operator(self):
            return self.getTypedRuleContext(search_grammarParser.Comparison_operatorContext, 0)

        def UNSIGNED_INTEGER(self):
            return self.getToken(search_grammarParser.UNSIGNED_INTEGER, 0)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterWinsRestriction"):
                listener.enterWinsRestriction(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitWinsRestriction"):
                listener.exitWinsRestriction(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitWinsRestriction"):
                return visitor.visitWinsRestriction(self)
            else:
                return visitor.visitChildren(self)

    class CreatorRestrictionContext(RestrictionContext):
        def __init__(self, parser, ctx: ParserRuleContext):  # actually a search_grammarParser.RestrictionContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def CREATOR_CODE(self):
            return self.getToken(search_grammarParser.CREATOR_CODE, 0)

        def subset_operator(self):
            return self.getTypedRuleContext(search_grammarParser.Subset_operatorContext, 0)

        def value(self):
            return self.getTypedRuleContext(search_grammarParser.ValueContext, 0)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterCreatorRestriction"):
                listener.enterCreatorRestriction(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitCreatorRestriction"):
                listener.exitCreatorRestriction(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitCreatorRestriction"):
                return visitor.visitCreatorRestriction(self)
            else:
                return visitor.visitChildren(self)

    class CardRestrictionContext(RestrictionContext):
        def __init__(self, parser, ctx: ParserRuleContext):  # actually a search_grammarParser.RestrictionContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def value(self):
            return self.getTypedRuleContext(search_grammarParser.ValueContext, 0)

        def PRINTING_CODE(self):
            return self.getToken(search_grammarParser.PRINTING_CODE, 0)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterCardRestriction"):
                listener.enterCardRestriction(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitCardRestriction"):
                listener.exitCardRestriction(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitCardRestriction"):
                return visitor.visitCardRestriction(self)
            else:
                return visitor.visitChildren(self)

    class DrawsRestrictionContext(RestrictionContext):
        def __init__(self, parser, ctx: ParserRuleContext):  # actually a search_grammarParser.RestrictionContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def DRAWS_CODE(self):
            return self.getToken(search_grammarParser.DRAWS_CODE, 0)

        def comparison_operator(self):
            return self.getTypedRuleContext(search_grammarParser.Comparison_operatorContext, 0)

        def UNSIGNED_INTEGER(self):
            return self.getToken(search_grammarParser.UNSIGNED_INTEGER, 0)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterDrawsRestriction"):
                listener.enterDrawsRestriction(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitDrawsRestriction"):
                listener.exitDrawsRestriction(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitDrawsRestriction"):
                return visitor.visitDrawsRestriction(self)
            else:
                return visitor.visitChildren(self)

    def restriction(self):
        localctx = search_grammarParser.RestrictionContext(self, self._ctx, self.state)
        self.enterRule(localctx, 4, self.RULE_restriction)
        try:
            self.state = 66
            self._errHandler.sync(self)
            token = self._input.LA(1)
            if token in [
                search_grammarParser.UNSIGNED_INTEGER,
                search_grammarParser.QUOTED_VALUE,
                search_grammarParser.VALUE,
            ]:
                localctx = search_grammarParser.CardRestrictionContext(self, localctx)
                self.enterOuterAlt(localctx, 1)
                self.state = 38
                self.value()
                pass
            elif token in [search_grammarParser.PRINTING_CODE]:
                localctx = search_grammarParser.CardRestrictionContext(self, localctx)
                self.enterOuterAlt(localctx, 2)
                self.state = 39
                self.match(search_grammarParser.PRINTING_CODE)
                self.state = 40
                self.match(search_grammarParser.T__5)
                self.state = 41
                self.value()
                pass
            elif token in [search_grammarParser.NAME_CODE]:
                localctx = search_grammarParser.NameRestrictionContext(self, localctx)
                self.enterOuterAlt(localctx, 3)
                self.state = 42
                self.match(search_grammarParser.NAME_CODE)
                self.state = 43
                self.subset_operator()
                self.state = 44
                self.value()
                pass
            elif token in [search_grammarParser.CREATOR_CODE]:
                localctx = search_grammarParser.CreatorRestrictionContext(self, localctx)
                self.enterOuterAlt(localctx, 4)
                self.state = 46
                self.match(search_grammarParser.CREATOR_CODE)
                self.state = 47
                self.subset_operator()
                self.state = 48
                self.value()
                pass
            elif token in [search_grammarParser.WINS_CODE]:
                localctx = search_grammarParser.WinsRestrictionContext(self, localctx)
                self.enterOuterAlt(localctx, 5)
                self.state = 50
                self.match(search_grammarParser.WINS_CODE)
                self.state = 51
                self.comparison_operator()
                self.state = 52
                self.match(search_grammarParser.UNSIGNED_INTEGER)
                pass
            elif token in [search_grammarParser.LOSSES_CODE]:
                localctx = search_grammarParser.LossesRestrictionContext(self, localctx)
                self.enterOuterAlt(localctx, 6)
                self.state = 54
                self.match(search_grammarParser.LOSSES_CODE)
                self.state = 55
                self.comparison_operator()
                self.state = 56
                self.match(search_grammarParser.UNSIGNED_INTEGER)
                pass
            elif token in [search_grammarParser.DRAWS_CODE]:
                localctx = search_grammarParser.DrawsRestrictionContext(self, localctx)
                self.enterOuterAlt(localctx, 7)
                self.state = 58
                self.match(search_grammarParser.DRAWS_CODE)
                self.state = 59
                self.comparison_operator()
                self.state = 60
                self.match(search_grammarParser.UNSIGNED_INTEGER)
                pass
            elif token in [search_grammarParser.CUBE_CODE]:
                localctx = search_grammarParser.CubeRestrictionContext(self, localctx)
                self.enterOuterAlt(localctx, 8)
                self.state = 62
                self.match(search_grammarParser.CUBE_CODE)
                self.state = 63
                self.subset_operator()
                self.state = 64
                self.value()
                pass
            else:
                raise NoViableAltException(self)

        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx

    class ValueContext(ParserRuleContext):
        __slots__ = "parser"

        def __init__(self, parser, parent: ParserRuleContext = None, invokingState: int = -1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def getRuleIndex(self):
            return search_grammarParser.RULE_value

        def copyFrom(self, ctx: ParserRuleContext):
            super().copyFrom(ctx)

    class InferredValueContext(ValueContext):
        def __init__(self, parser, ctx: ParserRuleContext):  # actually a search_grammarParser.ValueContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def VALUE(self):
            return self.getToken(search_grammarParser.VALUE, 0)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterInferredValue"):
                listener.enterInferredValue(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitInferredValue"):
                listener.exitInferredValue(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitInferredValue"):
                return visitor.visitInferredValue(self)
            else:
                return visitor.visitChildren(self)

    class UnsignedIntegerValueContext(ValueContext):
        def __init__(self, parser, ctx: ParserRuleContext):  # actually a search_grammarParser.ValueContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def UNSIGNED_INTEGER(self):
            return self.getToken(search_grammarParser.UNSIGNED_INTEGER, 0)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterUnsignedIntegerValue"):
                listener.enterUnsignedIntegerValue(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitUnsignedIntegerValue"):
                listener.exitUnsignedIntegerValue(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitUnsignedIntegerValue"):
                return visitor.visitUnsignedIntegerValue(self)
            else:
                return visitor.visitChildren(self)

    class QuotedValueContext(ValueContext):
        def __init__(self, parser, ctx: ParserRuleContext):  # actually a search_grammarParser.ValueContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def QUOTED_VALUE(self):
            return self.getToken(search_grammarParser.QUOTED_VALUE, 0)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterQuotedValue"):
                listener.enterQuotedValue(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitQuotedValue"):
                listener.exitQuotedValue(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitQuotedValue"):
                return visitor.visitQuotedValue(self)
            else:
                return visitor.visitChildren(self)

    def value(self):
        localctx = search_grammarParser.ValueContext(self, self._ctx, self.state)
        self.enterRule(localctx, 6, self.RULE_value)
        try:
            self.state = 71
            self._errHandler.sync(self)
            token = self._input.LA(1)
            if token in [search_grammarParser.VALUE]:
                localctx = search_grammarParser.InferredValueContext(self, localctx)
                self.enterOuterAlt(localctx, 1)
                self.state = 68
                self.match(search_grammarParser.VALUE)
                pass
            elif token in [search_grammarParser.QUOTED_VALUE]:
                localctx = search_grammarParser.QuotedValueContext(self, localctx)
                self.enterOuterAlt(localctx, 2)
                self.state = 69
                self.match(search_grammarParser.QUOTED_VALUE)
                pass
            elif token in [search_grammarParser.UNSIGNED_INTEGER]:
                localctx = search_grammarParser.UnsignedIntegerValueContext(self, localctx)
                self.enterOuterAlt(localctx, 3)
                self.state = 70
                self.match(search_grammarParser.UNSIGNED_INTEGER)
                pass
            else:
                raise NoViableAltException(self)

        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx

    class Subset_operatorContext(ParserRuleContext):
        __slots__ = "parser"

        def __init__(self, parser, parent: ParserRuleContext = None, invokingState: int = -1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def getRuleIndex(self):
            return search_grammarParser.RULE_subset_operator

        def copyFrom(self, ctx: ParserRuleContext):
            super().copyFrom(ctx)

    class InOperatorContext(Subset_operatorContext):
        def __init__(self, parser, ctx: ParserRuleContext):  # actually a search_grammarParser.Subset_operatorContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterInOperator"):
                listener.enterInOperator(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitInOperator"):
                listener.exitInOperator(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitInOperator"):
                return visitor.visitInOperator(self)
            else:
                return visitor.visitChildren(self)

    class ExactOperatorContext(Subset_operatorContext):
        def __init__(self, parser, ctx: ParserRuleContext):  # actually a search_grammarParser.Subset_operatorContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterExactOperator"):
                listener.enterExactOperator(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitExactOperator"):
                listener.exitExactOperator(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitExactOperator"):
                return visitor.visitExactOperator(self)
            else:
                return visitor.visitChildren(self)

    def subset_operator(self):
        localctx = search_grammarParser.Subset_operatorContext(self, self._ctx, self.state)
        self.enterRule(localctx, 8, self.RULE_subset_operator)
        try:
            self.state = 75
            self._errHandler.sync(self)
            token = self._input.LA(1)
            if token in [search_grammarParser.T__6]:
                localctx = search_grammarParser.ExactOperatorContext(self, localctx)
                self.enterOuterAlt(localctx, 1)
                self.state = 73
                self.match(search_grammarParser.T__6)
                pass
            elif token in [search_grammarParser.T__5]:
                localctx = search_grammarParser.InOperatorContext(self, localctx)
                self.enterOuterAlt(localctx, 2)
                self.state = 74
                self.match(search_grammarParser.T__5)
                pass
            else:
                raise NoViableAltException(self)

        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx

    class Comparison_operatorContext(ParserRuleContext):
        __slots__ = "parser"

        def __init__(self, parser, parent: ParserRuleContext = None, invokingState: int = -1):
            super().__init__(parent, invokingState)
            self.parser = parser

        def getRuleIndex(self):
            return search_grammarParser.RULE_comparison_operator

        def copyFrom(self, ctx: ParserRuleContext):
            super().copyFrom(ctx)

    class EqualsOperatorContext(Comparison_operatorContext):
        def __init__(
            self, parser, ctx: ParserRuleContext
        ):  # actually a search_grammarParser.Comparison_operatorContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterEqualsOperator"):
                listener.enterEqualsOperator(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitEqualsOperator"):
                listener.exitEqualsOperator(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitEqualsOperator"):
                return visitor.visitEqualsOperator(self)
            else:
                return visitor.visitChildren(self)

    class LessThanOperatorContext(Comparison_operatorContext):
        def __init__(
            self, parser, ctx: ParserRuleContext
        ):  # actually a search_grammarParser.Comparison_operatorContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterLessThanOperator"):
                listener.enterLessThanOperator(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitLessThanOperator"):
                listener.exitLessThanOperator(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitLessThanOperator"):
                return visitor.visitLessThanOperator(self)
            else:
                return visitor.visitChildren(self)

    class GreaterThanOperatorContext(Comparison_operatorContext):
        def __init__(
            self, parser, ctx: ParserRuleContext
        ):  # actually a search_grammarParser.Comparison_operatorContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterGreaterThanOperator"):
                listener.enterGreaterThanOperator(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitGreaterThanOperator"):
                listener.exitGreaterThanOperator(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitGreaterThanOperator"):
                return visitor.visitGreaterThanOperator(self)
            else:
                return visitor.visitChildren(self)

    class LessEqualOperatorContext(Comparison_operatorContext):
        def __init__(
            self, parser, ctx: ParserRuleContext
        ):  # actually a search_grammarParser.Comparison_operatorContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterLessEqualOperator"):
                listener.enterLessEqualOperator(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitLessEqualOperator"):
                listener.exitLessEqualOperator(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitLessEqualOperator"):
                return visitor.visitLessEqualOperator(self)
            else:
                return visitor.visitChildren(self)

    class GreaterEqualOperatorContext(Comparison_operatorContext):
        def __init__(
            self, parser, ctx: ParserRuleContext
        ):  # actually a search_grammarParser.Comparison_operatorContext
            super().__init__(parser)
            self.copyFrom(ctx)

        def enterRule(self, listener: ParseTreeListener):
            if hasattr(listener, "enterGreaterEqualOperator"):
                listener.enterGreaterEqualOperator(self)

        def exitRule(self, listener: ParseTreeListener):
            if hasattr(listener, "exitGreaterEqualOperator"):
                listener.exitGreaterEqualOperator(self)

        def accept(self, visitor: ParseTreeVisitor):
            if hasattr(visitor, "visitGreaterEqualOperator"):
                return visitor.visitGreaterEqualOperator(self)
            else:
                return visitor.visitChildren(self)

    def comparison_operator(self):
        localctx = search_grammarParser.Comparison_operatorContext(self, self._ctx, self.state)
        self.enterRule(localctx, 10, self.RULE_comparison_operator)
        try:
            self.state = 82
            self._errHandler.sync(self)
            token = self._input.LA(1)
            if token in [search_grammarParser.T__6]:
                localctx = search_grammarParser.EqualsOperatorContext(self, localctx)
                self.enterOuterAlt(localctx, 1)
                self.state = 77
                self.match(search_grammarParser.T__6)
                pass
            elif token in [search_grammarParser.T__7]:
                localctx = search_grammarParser.LessThanOperatorContext(self, localctx)
                self.enterOuterAlt(localctx, 2)
                self.state = 78
                self.match(search_grammarParser.T__7)
                pass
            elif token in [search_grammarParser.T__8]:
                localctx = search_grammarParser.LessEqualOperatorContext(self, localctx)
                self.enterOuterAlt(localctx, 3)
                self.state = 79
                self.match(search_grammarParser.T__8)
                pass
            elif token in [search_grammarParser.T__9]:
                localctx = search_grammarParser.GreaterThanOperatorContext(self, localctx)
                self.enterOuterAlt(localctx, 4)
                self.state = 80
                self.match(search_grammarParser.T__9)
                pass
            elif token in [search_grammarParser.T__10]:
                localctx = search_grammarParser.GreaterEqualOperatorContext(self, localctx)
                self.enterOuterAlt(localctx, 5)
                self.state = 81
                self.match(search_grammarParser.T__10)
                pass
            else:
                raise NoViableAltException(self)

        except RecognitionException as re:
            localctx.exception = re
            self._errHandler.reportError(self, re)
            self._errHandler.recover(self, re)
        finally:
            self.exitRule()
        return localctx

    def sempred(self, localctx: RuleContext, ruleIndex: int, predIndex: int):
        if self._predicates == None:
            self._predicates = dict()
        self._predicates[1] = self.operation_sempred
        pred = self._predicates.get(ruleIndex, None)
        if pred is None:
            raise Exception("No predicate with index:" + str(ruleIndex))
        else:
            return pred(localctx, predIndex)

    def operation_sempred(self, localctx: OperationContext, predIndex: int):
        if predIndex == 0:
            return self.precpred(self._ctx, 3)

        if predIndex == 1:
            return self.precpred(self._ctx, 2)

        if predIndex == 2:
            return self.precpred(self._ctx, 1)
