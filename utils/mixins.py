import datetime

from django.db.models import BooleanField, DateTimeField, Manager, Model, QuerySet


class TimestampedModel(Model):
    created_at = DateTimeField(editable=False, blank=False, auto_now_add=True)
    updated_at = DateTimeField(editable=False, blank=False, auto_now=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if kwargs.get("update_fields"):
            if "updated_at" not in kwargs["update_fields"]:
                if isinstance(kwargs["update_fields"], tuple):
                    kwargs["update_fields"] += ("updated_at",)
                elif isinstance(kwargs["update_fields"], list):
                    kwargs["update_fields"].append("updated_at")
        super().save(*args, **kwargs)


class SoftDeletionManager(Manager):
    def __init__(self, *args, **kwargs):
        self.alive_only = kwargs.pop("alive_only", True)
        super().__init__(*args, **kwargs)

    def get_queryset(self):
        if self.alive_only:
            return SoftDeletionQuerySet(self.model).filter(active=True)
        return SoftDeletionQuerySet(self.model)


class SoftDeletionModel(Model):
    active = BooleanField(editable=False, blank=False, default=True)
    deleted_at = DateTimeField(blank=True, null=True)

    objects = SoftDeletionManager()
    all_objects = SoftDeletionManager(alive_only=False)

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        return self.deactivate()

    def deactivate(self):
        self.active = False
        self.deleted_at = datetime.datetime.now()
        self.save(update_fields=("active", "deleted_at"))


class SoftDeletionQuerySet(QuerySet):
    def delete(self):
        return super().update(deleted_at=datetime.datetime.now(), active=False)

    def alive(self):
        return self.filter(active=True)

    def dead(self):
        return self.exclude(active=True)


# class WithEditPermissions(object):
#     edit_permissions = GenericRelation(
#         'api.EditPermission',
#         content_type_field = 'permission_for_content_type',
#         object_id_field = 'permission_for_object_id',
#     )
#
#     @property
#     def allowed_editing_users(self) -> QuerySet[AbstractUser]:
#         return get_user_model().objects.filter(edit_permissions__permission_for = self)
#
#     def can_edit(self, user: AbstractUser) -> bool:
#         return self.allowed_editing_users.filter(id = user.id).exists()
