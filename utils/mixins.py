from django.db.models import Model, DateTimeField


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
        super(TimestampedModel, self).save(*args, **kwargs)
