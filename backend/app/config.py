from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    gemini_api_key: str
    naver_client_id: str
    naver_client_secret: str
    finnhub_api_key: str
    single_user: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
