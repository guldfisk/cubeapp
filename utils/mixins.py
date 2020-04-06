import datetime

from django.db.models import Model, DateTimeField, Manager, BooleanField, QuerySet


class TimestampedModel(Model):
    created_at = DateTimeField(editable = False, blank = False, auto_now_add = True)
    updated_at = DateTimeField(editable = False, blank = False, auto_now = True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if kwargs.get('update_fields'):
            if 'updated_at' not in kwargs['update_fields']:
                if isinstance(kwargs['update_fields'], tuple):
                    kwargs['update_fields'] += ('updated_at',)
                elif isinstance(kwargs['update_fields'], list):
                    kwargs['update_fields'].append('updated_at')
        super().save(*args, **kwargs)


class SoftDeletionManager(Manager):

    def __init__(self, *args, **kwargs):
        self.alive_only = kwargs.pop('alive_only', True)
        super().__init__(*args, **kwargs)

    def get_queryset(self):
        if self.alive_only:
            return SoftDeletionQuerySet(self.model).filter(active = True)
        return SoftDeletionQuerySet(self.model)


class SoftDeletionModel(Model):
    active = BooleanField(editable = False, blank = False, default = True)
    deleted_at = DateTimeField(blank = True, null = True)

    objects = SoftDeletionManager()
    all_objects = SoftDeletionManager(alive_only = False)

    class Meta:
        abstract = True

    def delete(self, using = None, keep_parents = False):
        return self.deactivate()

    def deactivate(self):
        self.active = False
        self.deleted_at = datetime.datetime.now()
        self.save(update_fields = ('active', 'deleted_at'))


class SoftDeletionQuerySet(QuerySet):

    def delete(self):
        return super().update(deleted_at = datetime.datetime.now(), active = False)

    def alive(self):
        return self.filter(active = True)

    def dead(self):
        return self.exclude(active = True)
