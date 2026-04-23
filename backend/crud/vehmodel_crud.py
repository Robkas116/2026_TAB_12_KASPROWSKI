from sqlalchemy import select, func
from sqlalchemy.orm import Session

# Adjust the import paths according to your actual project structure
from models.vehmodel_model import VehModel, VehModelCreate, VehModelUpdate, VehModelsPublic


def create_vehmodel(*, session: Session, model_in: VehModelCreate) -> VehModel:
    """Creates a new vehicle model in the database.

    Uses explicit mapping to transfer data from the Pydantic schema 
    to the SQLAlchemy model. This ensures strict control over which 
    fields are populated during creation.
    """
    # Explicit mapping: mapping each field manually
    db_obj = VehModel(
        name=model_in.name,
        make_id=model_in.make_id
    )
    
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    
    return db_obj


def get_all_models(*, session: Session, skip: int = 0, limit: int = 100) -> VehModelsPublic:
    """Retrieves a list of vehicle models from the database.

    Args:
        skip (int, optional): Number of records to skip (offset). Defaults to 0.
        limit (int, optional): Maximum number of records to return. Defaults to 100.

    Returns:
        VehModelsPublic: A Pydantic schema containing the list of models and the total count.
    """
    # 1. Count the total number of models in the database
    total_count = session.scalar(select(func.count()).select_from(VehModel)) or 0

    # 2. Fetch the paginated rows
    statement = select(VehModel).offset(skip).limit(limit)
    models = session.scalars(statement).all()

    # 3. Return the populated Pydantic schema
    return VehModelsPublic(data=models, count=total_count)


def get_vehmodel_by_id(*, session: Session, model_id: int) -> VehModel | None:
    """
    Retrieves a vehicle model by its primary key (ID).
    """
    # session.get is the most efficient way to fetch by primary key in SQLAlchemy
    return session.get(VehModel, model_id)


def update_vehmodel(*, session: Session, db_model: VehModel, model_in: VehModelUpdate) -> VehModel:
    """
    Updates an existing vehicle model in the database.
    """
    # Explicit mapping for update: check if the value is not None 
    # before assigning it to the database model
    if model_in.name is not None:
        db_model.name = model_in.name
        
    if model_in.make_id is not None:
        db_model.make_id = model_in.make_id
        
    session.add(db_model)
    session.commit()
    session.refresh(db_model)
    
    return db_model


def delete_vehmodel(*, session: Session, db_model: VehModel) -> None:
    """
    Deletes a vehicle model from the database.
    """
    session.delete(db_model)
    session.commit()
    return None
