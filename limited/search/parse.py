from antlr4 import CommonTokenStream, InputStream
from antlr4.error.ErrorListener import ErrorListener

from mtgorp.db.database import CardDatabase

from limited.search.dto import DeckSearchDTO
from limited.search.gen.search_grammarLexer import search_grammarLexer
from limited.search.gen.search_grammarParser import search_grammarParser
from limited.search.visitor import SearchVisitor


class SearchPatternParseException(Exception):
    pass


class SearchPatternParseListener(ErrorListener):

    def syntaxError(self, recognizer, offendingSymbol, line, column, msg, e):
        raise SearchPatternParseException('Syntax error')

    def reportContextSensitivity(self, recognizer, dfa, startIndex, stopIndex, prediction, configs):
        raise SearchPatternParseException('Conetext sensitivity')


class SearchParser(object):

    def __init__(self, db: CardDatabase):
        self._db = db
        self._visitor = SearchVisitor(db)

    def parse(self, s: str) -> DeckSearchDTO:
        parser = search_grammarParser(
            CommonTokenStream(
                search_grammarLexer(
                    InputStream(s)
                )
            )
        )

        parser._listeners = [SearchPatternParseListener()]

        return self._visitor.visit(parser.start())
