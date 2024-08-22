# Generated from /home/phdk/PycharmProjects/cubeapp/limited/search/search_grammar.g4 by ANTLR 4.9.1
from antlr4 import *


if __name__ is not None and "." in __name__:
    from .search_grammarParser import search_grammarParser
else:
    from search_grammarParser import search_grammarParser


# This class defines a complete listener for a parse tree produced by search_grammarParser.
class search_grammarListener(ParseTreeListener):
    # Enter a parse tree produced by search_grammarParser#start.
    def enterStart(self, ctx: search_grammarParser.StartContext):
        pass

    # Exit a parse tree produced by search_grammarParser#start.
    def exitStart(self, ctx: search_grammarParser.StartContext):
        pass

    # Enter a parse tree produced by search_grammarParser#Not.
    def enterNot(self, ctx: search_grammarParser.NotContext):
        pass

    # Exit a parse tree produced by search_grammarParser#Not.
    def exitNot(self, ctx: search_grammarParser.NotContext):
        pass

    # Enter a parse tree produced by search_grammarParser#Parenthesis.
    def enterParenthesis(self, ctx: search_grammarParser.ParenthesisContext):
        pass

    # Exit a parse tree produced by search_grammarParser#Parenthesis.
    def exitParenthesis(self, ctx: search_grammarParser.ParenthesisContext):
        pass

    # Enter a parse tree produced by search_grammarParser#RestrictionOperation.
    def enterRestrictionOperation(self, ctx: search_grammarParser.RestrictionOperationContext):
        pass

    # Exit a parse tree produced by search_grammarParser#RestrictionOperation.
    def exitRestrictionOperation(self, ctx: search_grammarParser.RestrictionOperationContext):
        pass

    # Enter a parse tree produced by search_grammarParser#Or.
    def enterOr(self, ctx: search_grammarParser.OrContext):
        pass

    # Exit a parse tree produced by search_grammarParser#Or.
    def exitOr(self, ctx: search_grammarParser.OrContext):
        pass

    # Enter a parse tree produced by search_grammarParser#And.
    def enterAnd(self, ctx: search_grammarParser.AndContext):
        pass

    # Exit a parse tree produced by search_grammarParser#And.
    def exitAnd(self, ctx: search_grammarParser.AndContext):
        pass

    # Enter a parse tree produced by search_grammarParser#CardRestriction.
    def enterCardRestriction(self, ctx: search_grammarParser.CardRestrictionContext):
        pass

    # Exit a parse tree produced by search_grammarParser#CardRestriction.
    def exitCardRestriction(self, ctx: search_grammarParser.CardRestrictionContext):
        pass

    # Enter a parse tree produced by search_grammarParser#NameRestriction.
    def enterNameRestriction(self, ctx: search_grammarParser.NameRestrictionContext):
        pass

    # Exit a parse tree produced by search_grammarParser#NameRestriction.
    def exitNameRestriction(self, ctx: search_grammarParser.NameRestrictionContext):
        pass

    # Enter a parse tree produced by search_grammarParser#CreatorRestriction.
    def enterCreatorRestriction(self, ctx: search_grammarParser.CreatorRestrictionContext):
        pass

    # Exit a parse tree produced by search_grammarParser#CreatorRestriction.
    def exitCreatorRestriction(self, ctx: search_grammarParser.CreatorRestrictionContext):
        pass

    # Enter a parse tree produced by search_grammarParser#WinsRestriction.
    def enterWinsRestriction(self, ctx: search_grammarParser.WinsRestrictionContext):
        pass

    # Exit a parse tree produced by search_grammarParser#WinsRestriction.
    def exitWinsRestriction(self, ctx: search_grammarParser.WinsRestrictionContext):
        pass

    # Enter a parse tree produced by search_grammarParser#LossesRestriction.
    def enterLossesRestriction(self, ctx: search_grammarParser.LossesRestrictionContext):
        pass

    # Exit a parse tree produced by search_grammarParser#LossesRestriction.
    def exitLossesRestriction(self, ctx: search_grammarParser.LossesRestrictionContext):
        pass

    # Enter a parse tree produced by search_grammarParser#DrawsRestriction.
    def enterDrawsRestriction(self, ctx: search_grammarParser.DrawsRestrictionContext):
        pass

    # Exit a parse tree produced by search_grammarParser#DrawsRestriction.
    def exitDrawsRestriction(self, ctx: search_grammarParser.DrawsRestrictionContext):
        pass

    # Enter a parse tree produced by search_grammarParser#CubeRestriction.
    def enterCubeRestriction(self, ctx: search_grammarParser.CubeRestrictionContext):
        pass

    # Exit a parse tree produced by search_grammarParser#CubeRestriction.
    def exitCubeRestriction(self, ctx: search_grammarParser.CubeRestrictionContext):
        pass

    # Enter a parse tree produced by search_grammarParser#InferredValue.
    def enterInferredValue(self, ctx: search_grammarParser.InferredValueContext):
        pass

    # Exit a parse tree produced by search_grammarParser#InferredValue.
    def exitInferredValue(self, ctx: search_grammarParser.InferredValueContext):
        pass

    # Enter a parse tree produced by search_grammarParser#QuotedValue.
    def enterQuotedValue(self, ctx: search_grammarParser.QuotedValueContext):
        pass

    # Exit a parse tree produced by search_grammarParser#QuotedValue.
    def exitQuotedValue(self, ctx: search_grammarParser.QuotedValueContext):
        pass

    # Enter a parse tree produced by search_grammarParser#UnsignedIntegerValue.
    def enterUnsignedIntegerValue(self, ctx: search_grammarParser.UnsignedIntegerValueContext):
        pass

    # Exit a parse tree produced by search_grammarParser#UnsignedIntegerValue.
    def exitUnsignedIntegerValue(self, ctx: search_grammarParser.UnsignedIntegerValueContext):
        pass

    # Enter a parse tree produced by search_grammarParser#ExactOperator.
    def enterExactOperator(self, ctx: search_grammarParser.ExactOperatorContext):
        pass

    # Exit a parse tree produced by search_grammarParser#ExactOperator.
    def exitExactOperator(self, ctx: search_grammarParser.ExactOperatorContext):
        pass

    # Enter a parse tree produced by search_grammarParser#InOperator.
    def enterInOperator(self, ctx: search_grammarParser.InOperatorContext):
        pass

    # Exit a parse tree produced by search_grammarParser#InOperator.
    def exitInOperator(self, ctx: search_grammarParser.InOperatorContext):
        pass

    # Enter a parse tree produced by search_grammarParser#EqualsOperator.
    def enterEqualsOperator(self, ctx: search_grammarParser.EqualsOperatorContext):
        pass

    # Exit a parse tree produced by search_grammarParser#EqualsOperator.
    def exitEqualsOperator(self, ctx: search_grammarParser.EqualsOperatorContext):
        pass

    # Enter a parse tree produced by search_grammarParser#LessThanOperator.
    def enterLessThanOperator(self, ctx: search_grammarParser.LessThanOperatorContext):
        pass

    # Exit a parse tree produced by search_grammarParser#LessThanOperator.
    def exitLessThanOperator(self, ctx: search_grammarParser.LessThanOperatorContext):
        pass

    # Enter a parse tree produced by search_grammarParser#LessEqualOperator.
    def enterLessEqualOperator(self, ctx: search_grammarParser.LessEqualOperatorContext):
        pass

    # Exit a parse tree produced by search_grammarParser#LessEqualOperator.
    def exitLessEqualOperator(self, ctx: search_grammarParser.LessEqualOperatorContext):
        pass

    # Enter a parse tree produced by search_grammarParser#GreaterThanOperator.
    def enterGreaterThanOperator(self, ctx: search_grammarParser.GreaterThanOperatorContext):
        pass

    # Exit a parse tree produced by search_grammarParser#GreaterThanOperator.
    def exitGreaterThanOperator(self, ctx: search_grammarParser.GreaterThanOperatorContext):
        pass

    # Enter a parse tree produced by search_grammarParser#GreaterEqualOperator.
    def enterGreaterEqualOperator(self, ctx: search_grammarParser.GreaterEqualOperatorContext):
        pass

    # Exit a parse tree produced by search_grammarParser#GreaterEqualOperator.
    def exitGreaterEqualOperator(self, ctx: search_grammarParser.GreaterEqualOperatorContext):
        pass


del search_grammarParser
