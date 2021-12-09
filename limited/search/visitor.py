from mtgorp.db.database import CardDatabase
from mtgorp.tools.parsing.exceptions import ParseException
from mtgorp.tools.parsing.search.parse import SearchParser as CardSearchParser
from mtgorp.tools.search.extraction import PrintingStrategy


from limited.search.dto import (
    NotNode, OrNode, AndNode, PrintingNode, NameNode, CreatorNode, WinNode, LossNode, DrawNode, EXACT, CONTAINS,
    EQUALS, LESS_THAN, LESS_THAN_EQUALS, GREATER_THAN, GREATER_THAN_EQUALS, ParenthesisNode, DeckSearchDTO, CubeNode
)
from limited.search.gen.search_grammarParser import search_grammarParser
from limited.search.gen.search_grammarVisitor import search_grammarVisitor


class TypeParseException(ParseException):
    pass


class SearchVisitor(search_grammarVisitor):

    def __init__(self, db: CardDatabase):
        self._db = db
        self._card_parser = CardSearchParser(self._db)

    def visitStart(self, ctx: search_grammarParser.StartContext):
        return DeckSearchDTO(self.visit(ctx.operation()))

    def visitNot(self, ctx: search_grammarParser.NotContext):
        return NotNode(self.visit(ctx.operation()))

    def visitParenthesis(self, ctx: search_grammarParser.ParenthesisContext):
        return ParenthesisNode(self.visit(ctx.operation()))

    def visitRestrictionOperation(self, ctx: search_grammarParser.RestrictionOperationContext):
        return self.visit(ctx.restriction())

    def visitOr(self, ctx: search_grammarParser.OrContext):
        return OrNode((self.visit(ctx.operation(0)), self.visit(ctx.operation(1))))

    def visitAnd(self, ctx: search_grammarParser.AndContext):
        return AndNode((self.visit(ctx.operation(0)), self.visit(ctx.operation(1))))

    def visitCardRestriction(self, ctx: search_grammarParser.CardRestrictionContext):
        return PrintingNode(self._card_parser.parse(self.visit(ctx.value()), PrintingStrategy))

    def visitNameRestriction(self, ctx: search_grammarParser.NameRestrictionContext):
        return NameNode(self.visit(ctx.value()), self.visit(ctx.subset_operator()))

    def visitCreatorRestriction(self, ctx: search_grammarParser.CreatorRestrictionContext):
        return CreatorNode(self.visit(ctx.value()), self.visit(ctx.subset_operator()))

    def visitWinsRestriction(self, ctx: search_grammarParser.WinsRestrictionContext):
        return WinNode(int(ctx.UNSIGNED_INTEGER().getText()), self.visit(ctx.comparison_operator()))

    def visitLossesRestriction(self, ctx: search_grammarParser.LossesRestrictionContext):
        return LossNode(int(ctx.UNSIGNED_INTEGER().getText()), self.visit(ctx.comparison_operator()))

    def visitDrawsRestriction(self, ctx: search_grammarParser.DrawsRestrictionContext):
        return DrawNode(int(ctx.UNSIGNED_INTEGER().getText()), self.visit(ctx.comparison_operator()))

    def visitInferredValue(self, ctx: search_grammarParser.InferredValueContext):
        return ctx.getText()

    def visitQuotedValue(self, ctx: search_grammarParser.QuotedValueContext):
        return ctx.getText()[1:-1]

    def visitUnsignedIntegerValue(self, ctx: search_grammarParser.UnsignedIntegerValueContext):
        return ctx.getText()

    def visitExactOperator(self, ctx: search_grammarParser.ExactOperatorContext):
        return EXACT

    def visitInOperator(self, ctx: search_grammarParser.InOperatorContext):
        return CONTAINS

    def visitEqualsOperator(self, ctx: search_grammarParser.EqualsOperatorContext):
        return EQUALS

    def visitLessThanOperator(self, ctx: search_grammarParser.LessThanOperatorContext):
        return LESS_THAN

    def visitLessEqualOperator(self, ctx: search_grammarParser.LessEqualOperatorContext):
        return LESS_THAN_EQUALS

    def visitGreaterThanOperator(self, ctx: search_grammarParser.GreaterThanOperatorContext):
        return GREATER_THAN

    def visitGreaterEqualOperator(self, ctx: search_grammarParser.GreaterEqualOperatorContext):
        return GREATER_THAN_EQUALS

    def visitCubeRestriction(self, ctx: search_grammarParser.CubeRestrictionContext):
        return CubeNode(self.visit(ctx.value()), self.visit(ctx.subset_operator()))
