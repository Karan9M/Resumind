import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { prepareInstructions } from "~/constants";
import { convertPdfToImage } from "~/lib/pdfToImage";
import { usePuterStore } from "~/lib/puter";
import { generateUUID } from "~/lib/utils";

export default function upload() {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();
  const [isProccessing, setIsProccessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setIsProccessing(true);
    setStatusText("Uploading the file...");
    const uploadedFile = await fs.upload([file]);
    if (!uploadedFile) return setStatusText("Error:failed to upload file");
    setStatusText("Converting to image");
    const imageFile = await convertPdfToImage(file);
    if (!imageFile.file)
      return setStatusText("Error:failed to convert Pdf to image");
    setStatusText("Uploading the image");
    const uploadedImage = await fs.upload([imageFile.file]);
    if (!uploadedImage) return setStatusText("Error:failed to upload image");
    setStatusText("Preparing data... ");
    const uuid = generateUUID();
    const data = {
      id: uuid,
      resumePath: uploadedFile.path,
      imagePath: uploadedImage.path,
      companyName,
      jobTitle,
      jobDescription,
      feedback: "",
    };
    await kv.set(`resume:${uuid}`, JSON.stringify(data));
    setStatusText("Analyzing...");
    const feedback = await ai.feedback(
      uploadedFile.path,
      prepareInstructions({ jobTitle, jobDescription })
    );
    if (!feedback) return setStatusText("Error: failed to analyze resume");
    const feedbackText =
      typeof feedback.message.content === "string"
        ? feedback.message.content
        : feedback.message.content[0].text;

    data.feedback = JSON.parse(feedbackText);
    await kv.set(`resume:${uuid}`, JSON.stringify(data));
    setStatusText("Analysis complted,redirecting...");
    navigate(`/resume/${uuid}`);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest("form");
    if (!form) return;
    const formData = new FormData(form);
    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    if (!file) return;
    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>
          {isProccessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" alt="" className="w-full" />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvment tips.</h2>
          )}
        </div>
        {!isProccessing && (
          <form
            id="upload-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 mt-8"
          >
            <div className="form-div">
              <label htmlFor="company-name">Company Name</label>
              <input
                type="text"
                name="company-name"
                placeholder="Company Name"
                id="company-name"
              />
            </div>
            <div className="form-div">
              <label htmlFor="job-title">Job Title</label>
              <input
                type="text"
                name="job-title"
                placeholder="Job Title"
                id="job-title"
              />
            </div>
            <div className="form-div">
              <label htmlFor="job-description">Job Description</label>
              <textarea
                rows={5}
                name="job-description"
                placeholder="Job Description"
                id="job-description"
              />
            </div>
            <div className="form-div">
              <label htmlFor="uploader">Upload Resume</label>
              <FileUploader onFileSelect={handleFileSelect} />
            </div>
            <button className="primary-button" type="submit">
              Analyze Resume
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
