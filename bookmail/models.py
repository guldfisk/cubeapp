import typing as t
import tempfile

from bs4 import BeautifulSoup
from django.db import models
from django.db.models import Max
from ebooklib import epub
from ebooklib.epub import EpubBook, EpubHtml

from api.boto import get_boto_client
from api.mail import send_mail
from utils.mixins import TimestampedModel


class Book(TimestampedModel):
    title = models.CharField(max_length = 512)
    name = models.CharField(max_length = 512)

    def get_book(self) -> EpubBook:
        # Garbage lib only reads from disk
        with tempfile.NamedTemporaryFile() as f:
            get_boto_client().download_fileobj('phdk', f'books/{self.name}', f)
            f.flush()
            return epub.read_epub(f.name)

    @classmethod
    def _get_chapters(cls, book: EpubBook) -> t.List[str]:
        return [
            content for content in (
                BeautifulSoup(item.content, "html.parser").get_text(separator = " ", strip = True)
                for item in
                book.get_items()
                if isinstance(item, EpubHtml)
            ) if 'chapter' in content[:30].lower()
        ]

    def current_chapter_number(self) -> int:
        _mail_number = self.chapter_mails.aggregate(Max('chapter_number'))['chapter_number__max']
        return _mail_number if _mail_number is not None else -1

    def send_next_mail(self) -> None:
        next_chapter_number = self.current_chapter_number() + 1
        chapters = self._get_chapters(self.get_book())
        if next_chapter_number >= len(chapters):
            return
        send_mail(
            subject = f'{self.title} chapter {next_chapter_number + 1}',
            content = chapters[next_chapter_number],
            recipients = self.mail_recipients.values_list('email', flat = True),
        )
        ChapterMail.objects.create(book = self, chapter_number = next_chapter_number)


class BookMailRecipient(TimestampedModel):
    book = models.ForeignKey(Book, on_delete = models.CASCADE, related_name = 'mail_recipients')
    email = models.EmailField()


class ChapterMail(TimestampedModel):
    book = models.ForeignKey(Book, on_delete = models.CASCADE, related_name = 'chapter_mails')
    chapter_number = models.IntegerField()
