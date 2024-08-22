# Generated from /home/phdk/PycharmProjects/cubeapp/limited/search/search_grammar.g4 by ANTLR 4.9.1
from antlr4 import *


if __name__ is not None and "." in __name__:
    from .search_grammarParser import search_grammarParser
else:
    from search_grammarParser import search_grammarParser

# This class defines a complete generic visitor for a parse tree produced by search_grammarParser.


class search_grammarVisitor(ParseTreeVisitor):
    # Visit a parse tree produced by search_grammarParser#start.
    def visitStart(self, ctx: search_grammarParser.StartContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#Not.
    def visitNot(self, ctx: search_grammarParser.NotContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#Parenthesis.
    def visitParenthesis(self, ctx: search_grammarParser.ParenthesisContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#RestrictionOperation.
    def visitRestrictionOperation(self, ctx: search_grammarParser.RestrictionOperationContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#Or.
    def visitOr(self, ctx: search_grammarParser.OrContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#And.
    def visitAnd(self, ctx: search_grammarParser.AndContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#CardRestriction.
    def visitCardRestriction(self, ctx: search_grammarParser.CardRestrictionContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#NameRestriction.
    def visitNameRestriction(self, ctx: search_grammarParser.NameRestrictionContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#CreatorRestriction.
    def visitCreatorRestriction(self, ctx: search_grammarParser.CreatorRestrictionContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#WinsRestriction.
    def visitWinsRestriction(self, ctx: search_grammarParser.WinsRestrictionContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#LossesRestriction.
    def visitLossesRestriction(self, ctx: search_grammarParser.LossesRestrictionContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#DrawsRestriction.
    def visitDrawsRestriction(self, ctx: search_grammarParser.DrawsRestrictionContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#CubeRestriction.
    def visitCubeRestriction(self, ctx: search_grammarParser.CubeRestrictionContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#InferredValue.
    def visitInferredValue(self, ctx: search_grammarParser.InferredValueContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#QuotedValue.
    def visitQuotedValue(self, ctx: search_grammarParser.QuotedValueContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#UnsignedIntegerValue.
    def visitUnsignedIntegerValue(self, ctx: search_grammarParser.UnsignedIntegerValueContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#ExactOperator.
    def visitExactOperator(self, ctx: search_grammarParser.ExactOperatorContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#InOperator.
    def visitInOperator(self, ctx: search_grammarParser.InOperatorContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#EqualsOperator.
    def visitEqualsOperator(self, ctx: search_grammarParser.EqualsOperatorContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#LessThanOperator.
    def visitLessThanOperator(self, ctx: search_grammarParser.LessThanOperatorContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#LessEqualOperator.
    def visitLessEqualOperator(self, ctx: search_grammarParser.LessEqualOperatorContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#GreaterThanOperator.
    def visitGreaterThanOperator(self, ctx: search_grammarParser.GreaterThanOperatorContext):
        return self.visitChildren(ctx)

    # Visit a parse tree produced by search_grammarParser#GreaterEqualOperator.
    def visitGreaterEqualOperator(self, ctx: search_grammarParser.GreaterEqualOperatorContext):
        return self.visitChildren(ctx)


del search_grammarParser
