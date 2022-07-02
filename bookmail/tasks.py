from celery import shared_task

from bookmail.models import Book


@shared_task()
def send_book_mails():
    for book in Book.objects.all():
        book.send_next_mail()
